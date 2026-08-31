import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Normaliza todas las respuestas de error de la API a un mismo contrato:
 * { statusCode, path, timestamp, message }
 *
 * Captura tanto HttpException (errores esperados: validación, 401, 403, 404...)
 * como errores no controlados (bugs, fallos de Prisma, etc.), evitando que
 * el cliente reciba stack traces o mensajes internos.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = this.extractMessage(exception, isHttpException);

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      // Errores 5xx sí se registran con el detalle completo para diagnóstico interno.
      this.logger.error(
        `${request.method} ${request.url} -> ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(`${request.method} ${request.url} -> ${status} (${message})`);
    }

    response.status(status).json({
      statusCode: status,
      path: request.url,
      timestamp: new Date().toISOString(),
      message,
    });
  }

  private extractMessage(exception: unknown, isHttpException: boolean): string | string[] {
    if (isHttpException) {
      const response = (exception as HttpException).getResponse();
      if (typeof response === 'string') {
        return response;
      }
      if (typeof response === 'object' && response !== null && 'message' in response) {
        return (response as { message: string | string[] }).message;
      }
    }
    return 'Internal server error';
  }
}
