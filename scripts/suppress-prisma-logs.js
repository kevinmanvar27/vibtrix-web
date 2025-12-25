#!/usr/bin/env node

/**
 * Script to suppress Prisma logs by patching the Prisma Client
 * This script creates a patch for the Prisma Client to disable all logging
 * 
 * Usage: node scripts/suppress-prisma-logs.js
 */

const fs = require('fs');
const path = require('path');

// Path to the Prisma Client index.js file
const prismaClientPath = path.join(
  process.cwd(),
  'node_modules',
  '.prisma',
  'client',
  'index.js'
);

// Check if the Prisma Client file exists
if (!fs.existsSync(prismaClientPath)) {
  console.error('Prisma Client file not found. Make sure Prisma is installed.');
  process.exit(1);
}

// Read the Prisma Client file
const prismaClientContent = fs.readFileSync(prismaClientPath, 'utf8');

// Check if the file has already been patched
if (prismaClientContent.includes('// PATCHED TO DISABLE LOGS')) {
  console.log('Prisma Client has already been patched to disable logs.');
  process.exit(0);
}

// Find the logging code in the Prisma Client
const loggingCode = `get _engineConfig() {
    return {
      cwd: this._baseDirPath,
      datamodelPath: this._datamodelPath,
      prismaPath: this._prismaPath,
      engineEndpoint: this._engineEndpoint,
      datasources: this._datasources,
      generator: this._generator,
      showColors: this._showColors,
      logQueries: this._logQueries,
      logLevel: this._logLevel,
      env: this._env,
      flags: this._flags,
      clientVersion: this._clientVersion,
      previewFeatures: this._previewFeatures,
      activeProvider: this._activeProvider,
      inlineSchema: this._inlineSchema,
      inlineDatasources: this._inlineDatasources,
      inlineSchemaHash: this._inlineSchemaHash,
      tracingConfig: this._tracingConfig,
      logEmitter: this._logEmitter,
      engineProtocol: this._engineProtocol,
      isBundled: this._isBundled
    };
  }`;

// Create the patched logging code
const patchedLoggingCode = `get _engineConfig() {
    return {
      cwd: this._baseDirPath,
      datamodelPath: this._datamodelPath,
      prismaPath: this._prismaPath,
      engineEndpoint: this._engineEndpoint,
      datasources: this._datasources,
      generator: this._generator,
      showColors: this._showColors,
      logQueries: false, // PATCHED TO DISABLE LOGS
      logLevel: 'error', // PATCHED TO DISABLE LOGS
      env: this._env,
      flags: this._flags,
      clientVersion: this._clientVersion,
      previewFeatures: this._previewFeatures,
      activeProvider: this._activeProvider,
      inlineSchema: this._inlineSchema,
      inlineDatasources: this._inlineDatasources,
      inlineSchemaHash: this._inlineSchemaHash,
      tracingConfig: this._tracingConfig,
      logEmitter: { on: () => {}, emit: () => {} }, // PATCHED TO DISABLE LOGS
      engineProtocol: this._engineProtocol,
      isBundled: this._isBundled
    };
  }`;

// Replace the logging code with the patched version
const patchedPrismaClientContent = prismaClientContent.replace(
  loggingCode,
  patchedLoggingCode
);

// Write the patched Prisma Client file
fs.writeFileSync(prismaClientPath, patchedPrismaClientContent, 'utf8');

console.log('Prisma Client has been patched to disable logs.');
