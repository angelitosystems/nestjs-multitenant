import { HttpException, HttpStatus } from '@nestjs/common';
import { ERROR_MESSAGES } from '../constants/tokens';

export class TenantNotFoundException extends HttpException {
  constructor(tenantId: string) {
    super(
      {
        message: ERROR_MESSAGES.TENANT_NOT_FOUND,
        tenantId,
        statusCode: HttpStatus.NOT_FOUND,
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

export class TenantInactiveException extends HttpException {
  constructor(tenantId: string) {
    super(
      {
        message: ERROR_MESSAGES.TENANT_INACTIVE,
        tenantId,
        statusCode: HttpStatus.FORBIDDEN,
      },
      HttpStatus.FORBIDDEN,
    );
  }
}

export class InvalidTenantIdException extends HttpException {
  constructor(tenantId: string) {
    super(
      {
        message: ERROR_MESSAGES.INVALID_TENANT_ID,
        tenantId,
        statusCode: HttpStatus.BAD_REQUEST,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class TenantConnectionException extends HttpException {
  constructor(tenantId: string, originalError?: Error) {
    super(
      {
        message: ERROR_MESSAGES.CONNECTION_FAILED,
        tenantId,
        originalError: originalError?.message,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

export class CentralDatabaseConnectionException extends HttpException {
  constructor(originalError?: Error) {
    super(
      {
        message: ERROR_MESSAGES.CENTRAL_DB_CONNECTION_FAILED,
        originalError: originalError?.message,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

export class TenantConfigMissingException extends HttpException {
  constructor() {
    super(
      {
        message: ERROR_MESSAGES.TENANT_CONFIG_MISSING,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

export class UnsupportedDatabaseDriverException extends HttpException {
  constructor(driver: string) {
    super(
      {
        message: ERROR_MESSAGES.UNSUPPORTED_DATABASE_DRIVER,
        driver,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

export class TenantIdentifierNotFoundException extends HttpException {
  constructor(identifierType: string, key: string) {
    super(
      {
        message: ERROR_MESSAGES.TENANT_IDENTIFIER_NOT_FOUND,
        identifierType,
        key,
        statusCode: HttpStatus.BAD_REQUEST,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}