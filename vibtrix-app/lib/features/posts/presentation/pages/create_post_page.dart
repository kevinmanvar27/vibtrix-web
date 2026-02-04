import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:dio/dio.dart';
import 'package:http_parser/http_parser.dart';
import 'dart:io';

import '../../../../core/providers/core_providers.dart';
import '../../../../core/providers/repository_providers.dart';
import '../../../../core/network/upload_api_service.dart';
import '../../../feed/presentation/providers/feed_provider.dart';
import '../../data/models/post_model.dart';

/// Page for creating a new post with media
class CreatePostPage extends ConsumerStatefulWidget {
  const CreatePostPage({super.key});

  @override
  ConsumerState<CreatePostPage> createState() => _CreatePostPageState();
}

class _CreatePostPageState extends ConsumerState<CreatePostPage> {
  final _captionController = TextEditingController();
  final _hashtagController = TextEditingController();
  final List<XFile> _selectedMedia = [];
  final List<String> _hashtags = [];
  bool _isPosting = false;
  String _selectedMediaType = 'image'; // 'image' or 'video'
  String _uploadStatus = '';

  @override
  void dispose() {
    _captionController.dispose();
    _hashtagController.dispose();
    super.dispose();
  }

  Future<void> _pickMedia(ImageSource source) async {
    final picker = ImagePicker();
    
    try {
      if (_selectedMediaType == 'video') {
        final video = await picker.pickVideo(
          source: source,
          maxDuration: const Duration(minutes: 3),
        );
        if (video != null) {
          setState(() {
            _selectedMedia.clear();
            _selectedMedia.add(video);
          });
        }
      } else {
        if (source == ImageSource.gallery) {
          final images = await picker.pickMultiImage(
            maxWidth: 1920,
            maxHeight: 1920,
            imageQuality: 85,
          );
          if (images.isNotEmpty) {
            setState(() {
              _selectedMedia.addAll(images.take(10 - _selectedMedia.length));
            });
          }
        } else {
          final image = await picker.pickImage(
            source: source,
            maxWidth: 1920,
            maxHeight: 1920,
            imageQuality: 85,
          );
          if (image != null) {
            setState(() {
              if (_selectedMedia.length < 10) {
                _selectedMedia.add(image);
              }
            });
          }
        }
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error picking media: $e')),
      );
    }
  }

  void _removeMedia(int index) {
    setState(() {
      _selectedMedia.removeAt(index);
    });
  }

  void _addHashtag() {
    final tag = _hashtagController.text.trim();
    if (tag.isNotEmpty && !_hashtags.contains(tag)) {
      setState(() {
        _hashtags.add(tag.startsWith('#') ? tag : '#$tag');
        _hashtagController.clear();
      });
    }
  }

  void _removeHashtag(String tag) {
    setState(() {
      _hashtags.remove(tag);
    });
  }

  Future<void> _createPost() async {
    if (_selectedMedia.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select at least one image or video')),
      );
      return;
    }

    setState(() {
      _isPosting = true;
      _uploadStatus = 'Uploading media...';
    });

    try {
      // Step 1: Upload all media files and collect media IDs
      final dioClient = ref.read(dioClientProvider);
      final List<String> mediaIds = [];
      
      for (int i = 0; i < _selectedMedia.length; i++) {
        final media = _selectedMedia[i];
        setState(() {
          _uploadStatus = 'Uploading ${i + 1}/${_selectedMedia.length}...';
        });
        
        // Read file bytes
        final file = File(media.path);
        final bytes = await file.readAsBytes();
        final fileName = media.name;
        
        // Determine content type
        final ext = fileName.split('.').last.toLowerCase();
        String contentType;
        switch (ext) {
          case 'jpg':
          case 'jpeg':
            contentType = 'image/jpeg';
            break;
          case 'png':
            contentType = 'image/png';
            break;
          case 'gif':
            contentType = 'image/gif';
            break;
          case 'webp':
            contentType = 'image/webp';
            break;
          case 'mp4':
            contentType = 'video/mp4';
            break;
          case 'mov':
            contentType = 'video/quicktime';
            break;
          case 'avi':
            contentType = 'video/x-msvideo';
            break;
          default:
            contentType = 'application/octet-stream';
        }
        
        // Create form data for upload
        final formData = FormData();
        formData.files.add(MapEntry(
          'files',
          MultipartFile.fromBytes(
            bytes.toList(),
            filename: fileName,
            contentType: MediaType.parse(contentType),
          ),
        ));
        
        // Upload to server
        final response = await dioClient.dio.post(
          '/upload',
          data: formData,
          options: Options(contentType: 'multipart/form-data'),
        );
        
        // Parse response and collect media IDs
        final uploadResponse = MediaUploadResponse.fromJson(response.data as Map<String, dynamic>);
        for (final uploadedFile in uploadResponse.files) {
          mediaIds.add(uploadedFile.mediaId);
        }
      }
      
      if (mediaIds.isEmpty) {
        throw Exception('Failed to upload media files');
      }
      
      setState(() {
        _uploadStatus = 'Creating post...';
      });
      
      // Step 2: Build caption with hashtags
      String caption = _captionController.text.trim();
      if (_hashtags.isNotEmpty) {
        final hashtagString = _hashtags.join(' ');
        caption = caption.isEmpty ? hashtagString : '$caption\n\n$hashtagString';
      }
      
      // Step 3: Create the post with media IDs
      final request = CreatePostRequest(
        content: caption,
        mediaIds: mediaIds,
      );
      
      final postsRepository = ref.read(postsRepositoryProvider);
      final result = await postsRepository.createPost(request);
      
      result.fold(
        (failure) {
          throw Exception(failure.message ?? 'Failed to create post');
        },
        (post) {
          // Success! Add post to feed and navigate back
          ref.read(feedProvider.notifier).addPost(post);
          
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Post created successfully! 🎉'),
                backgroundColor: Colors.green,
              ),
            );
            Navigator.pop(context, post);
          }
        },
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isPosting = false;
          _uploadStatus = '';
        });
      }
    }
  }

  void _showMediaSourceDialog() {
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.camera_alt),
              title: const Text('Camera'),
              onTap: () {
                Navigator.pop(context);
                _pickMedia(ImageSource.camera);
              },
            ),
            ListTile(
              leading: const Icon(Icons.photo_library),
              title: const Text('Gallery'),
              onTap: () {
                Navigator.pop(context);
                _pickMedia(ImageSource.gallery);
              },
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Create Post'),
        actions: [
          if (_isPosting)
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
                  if (_uploadStatus.isNotEmpty) ...[
                    const SizedBox(width: 8),
                    Text(
                      _uploadStatus,
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ],
              ),
            )
          else
            TextButton(
              onPressed: _selectedMedia.isEmpty ? null : _createPost,
              child: Text(
                'Post',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: _selectedMedia.isEmpty 
                      ? Colors.grey 
                      : Theme.of(context).colorScheme.primary,
                ),
              ),
            ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Media type selector
            Row(
              children: [
                Expanded(
                  child: SegmentedButton<String>(
                    segments: const [
                      ButtonSegment(
                        value: 'image',
                        icon: Icon(Icons.image),
                        label: Text('Photo'),
                      ),
                      ButtonSegment(
                        value: 'video',
                        icon: Icon(Icons.videocam),
                        label: Text('Video'),
                      ),
                    ],
                    selected: {_selectedMediaType},
                    onSelectionChanged: (selection) {
                      setState(() {
                        _selectedMediaType = selection.first;
                        _selectedMedia.clear();
                      });
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            
            // Media picker/preview
            _selectedMedia.isEmpty
                ? _buildMediaPicker()
                : _buildMediaPreview(),
            
            const SizedBox(height: 20),
            
            // Caption
            TextField(
              controller: _captionController,
              maxLines: 4,
              maxLength: 2200,
              decoration: InputDecoration(
                hintText: 'Write a caption...',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                filled: true,
              ),
            ),
            
            const SizedBox(height: 16),
            
            // Hashtags
            Text(
              'Hashtags',
              style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _hashtagController,
                    decoration: InputDecoration(
                      hintText: 'Add hashtag',
                      prefixText: '#',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 8,
                      ),
                    ),
                    onSubmitted: (_) => _addHashtag(),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton.filled(
                  onPressed: _addHashtag,
                  icon: const Icon(Icons.add),
                ),
              ],
            ),
            if (_hashtags.isNotEmpty) ...[
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _hashtags.map((tag) {
                  return Chip(
                    label: Text(tag),
                    deleteIcon: const Icon(Icons.close, size: 16),
                    onDeleted: () => _removeHashtag(tag),
                    backgroundColor: Theme.of(context).colorScheme.primaryContainer,
                  );
                }).toList(),
              ),
            ],
            
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _buildMediaPicker() {
    return GestureDetector(
      onTap: _showMediaSourceDialog,
      child: Container(
        height: 300,
        width: double.infinity,
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: Theme.of(context).colorScheme.outline.withValues(alpha: 0.3),
            width: 2,
            strokeAlign: BorderSide.strokeAlignInside,
          ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                _selectedMediaType == 'video' 
                    ? Icons.videocam 
                    : Icons.add_photo_alternate_outlined,
                size: 48,
                color: Theme.of(context).colorScheme.primary,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              _selectedMediaType == 'video'
                  ? 'Tap to add video'
                  : 'Tap to add photos',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
            ),
            const SizedBox(height: 4),
            Text(
              _selectedMediaType == 'video'
                  ? 'Max 3 minutes'
                  : 'Up to 10 photos',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.grey,
                  ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMediaPreview() {
    if (_selectedMediaType == 'video' && _selectedMedia.isNotEmpty) {
      return Stack(
        children: [
          Container(
            height: 300,
            width: double.infinity,
            decoration: BoxDecoration(
              color: Colors.black,
              borderRadius: BorderRadius.circular(16),
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: Stack(
                alignment: Alignment.center,
                children: [
                  // Video thumbnail placeholder
                  Container(
                    color: Colors.grey.shade900,
                    child: const Center(
                      child: Icon(
                        Icons.play_circle_fill,
                        size: 64,
                        color: Colors.white70,
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: 12,
                    left: 12,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.black54,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.videocam, color: Colors.white, size: 16),
                          const SizedBox(width: 4),
                          Text(
                            _selectedMedia.first.name,
                            style: const TextStyle(color: Colors.white, fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          Positioned(
            top: 8,
            right: 8,
            child: IconButton.filled(
              onPressed: () => _removeMedia(0),
              icon: const Icon(Icons.close),
              style: IconButton.styleFrom(
                backgroundColor: Colors.black54,
              ),
            ),
          ),
        ],
      );
    }

    // Image grid preview
    return Column(
      children: [
        SizedBox(
          height: 200,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            itemCount: _selectedMedia.length + (_selectedMedia.length < 10 ? 1 : 0),
            itemBuilder: (context, index) {
              if (index == _selectedMedia.length) {
                // Add more button
                return GestureDetector(
                  onTap: _showMediaSourceDialog,
                  child: Container(
                    width: 150,
                    margin: const EdgeInsets.only(right: 8),
                    decoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.surfaceContainerHighest,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: Theme.of(context).colorScheme.outline.withValues(alpha: 0.3),
                      ),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.add,
                          size: 32,
                          color: Theme.of(context).colorScheme.primary,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Add More',
                          style: TextStyle(
                            color: Theme.of(context).colorScheme.primary,
                          ),
                        ),
                        Text(
                          '${10 - _selectedMedia.length} left',
                          style: TextStyle(
                            color: Colors.grey.shade600,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }

              final media = _selectedMedia[index];
              return Stack(
                children: [
                  Container(
                    width: 150,
                    margin: const EdgeInsets.only(right: 8),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: Image.file(
                        File(media.path),
                        fit: BoxFit.cover,
                        height: 200,
                      ),
                    ),
                  ),
                  Positioned(
                    top: 4,
                    right: 12,
                    child: GestureDetector(
                      onTap: () => _removeMedia(index),
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        decoration: const BoxDecoration(
                          color: Colors.black54,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.close,
                          color: Colors.white,
                          size: 16,
                        ),
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: 4,
                    left: 4,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: Colors.black54,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        '${index + 1}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                ],
              );
            },
          ),
        ),
        const SizedBox(height: 8),
        Text(
          '${_selectedMedia.length}/10 photos selected',
          style: TextStyle(
            color: Colors.grey.shade600,
            fontSize: 12,
          ),
        ),
      ],
    );
  }
}
