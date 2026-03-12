# Quick Testing Guide - Competition Submission Fix

## Before You Test

1. **Rebuild the app:**
   ```bash
   cd vibtrix-app
   flutter pub get
   dart run build_runner build --delete-conflicting-outputs
   flutter run
   ```

2. **Backend Requirements:**
   - Backend server must be running
   - You need a valid user account
   - At least one active competition with an open round

## Test Flow

### Test 1: Basic Submission ✅
1. Open the app and login
2. Navigate to **Competitions** tab
3. Select an active competition
4. Tap **"Create Entry"** or **"Submit Entry"** button
5. Select a photo/video (based on competition type)
6. Add a caption (optional)
7. Tap **Submit**

**Expected Result:**
- ✅ No 401 error
- ✅ Success message appears
- ✅ You're navigated back to competition detail
- ✅ Your entry appears in the competition

### Test 2: Multiple Media
1. Follow steps 1-4 from Test 1
2. Select **multiple photos** (if competition allows)
3. Submit

**Expected Result:**
- ✅ All media uploads successfully
- ✅ Entry created with all media

### Test 3: Error Cases
Try these scenarios to verify error handling:

**A. No Media Selected:**
- Try to submit without selecting any media
- **Expected:** Error message shown

**B. Duplicate Submission:**
- Submit an entry to a round
- Try to submit another entry to the **same round**
- **Expected:** Backend rejects with appropriate error

**C. Closed Competition:**
- Try to submit to a competition with no active rounds
- **Expected:** Error message or button disabled

## Debug Console

Watch for these log messages:

```
✅ Success:
🏆 [CompetitionDetail] Submitting entry to round: xxx with 1 media
✅ [CompetitionDetail] Entry submitted successfully

❌ Failure:
🏆 [CompetitionDetail] Submitting entry to round: xxx with 1 media
❌ [CompetitionDetail] Submit failed: [error message]
```

## What Changed?

### Before (Wrong):
```
App → Create Post (/api/posts) → Submit postId → ❌ 401 Error
```

### After (Correct):
```
App → Upload Media → Submit mediaIds + roundId → ✅ Success
```

## Common Issues

### Issue: Still getting 401
**Solution:** 
- Clear app data and login again
- Check backend logs for specific error
- Verify competition has active rounds

### Issue: Media not uploading
**Solution:**
- Check file permissions
- Verify file size limits
- Check network connection

### Issue: "No active rounds available"
**Solution:**
- Check competition dates in backend
- Ensure at least one round is within start/end dates

## Success Indicators

✅ No 401 errors during submission  
✅ Entry appears in competition immediately  
✅ Backend receives correct data format  
✅ Regular posts (non-competition) still work  

## Need Help?

Check the detailed documentation: `COMPETITION_SUBMISSION_FIX.md`

---

**Status:** Ready for Testing  
**Build Status:** ✅ No Errors
