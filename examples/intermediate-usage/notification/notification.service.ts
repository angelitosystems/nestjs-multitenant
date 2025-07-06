import { Injectable } from '@nestjs/common';
import { InjectTenantId, InjectTenantInfo, TenantConnectionInfo } from '@angelitosystems/nestjs-multitenant-core';

export interface EmailNotification {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
  priority?: 'low' | 'normal' | 'high';
}

export interface SMSNotification {
  to: string;
  message: string;
  priority?: 'low' | 'normal' | 'high';
}

export interface PushNotification {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  priority?: 'low' | 'normal' | 'high';
}

export interface WelcomeEmailData {
  email: string;
  name: string;
  tenantId: string;
}

@Injectable()
export class NotificationService {
  constructor(
    @InjectTenantId() private tenantId: string,
    @InjectTenantInfo() private tenantInfo: TenantConnectionInfo,
  ) {}

  async sendWelcomeEmail(data: WelcomeEmailData): Promise<void> {
    try {
      const emailNotification: EmailNotification = {
        to: data.email,
        subject: `Welcome to ${this.tenantInfo.name}!`,
        template: 'welcome',
        data: {
          userName: data.name,
          tenantName: this.tenantInfo.name,
          loginUrl: `https://${this.tenantInfo.host}/login`,
          supportEmail: 'support@example.com',
        },
        priority: 'normal',
      };

      await this.sendEmail(emailNotification);
      console.log(`Welcome email sent to ${data.email} for tenant ${data.tenantId}`);
    } catch (error) {
      console.error('Failed to send welcome email:', error);
    }
  }

  async sendEmail(notification: EmailNotification): Promise<void> {
    try {
      console.log('Sending email notification:', {
        to: notification.to,
        subject: notification.subject,
        template: notification.template,
        tenantId: this.tenantId,
      });

      // Example: Send email using your preferred email service
      // await this.emailProvider.send({
      //   from: `noreply@${this.tenantInfo.host}`,
      //   to: notification.to,
      //   subject: notification.subject,
      //   template: notification.template,
      //   templateData: notification.data,
      // });

      // Example: Queue email for background processing
      // await this.queueService.add('send-email', notification);

    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }

  async sendSMS(notification: SMSNotification): Promise<void> {
    try {
      console.log('Sending SMS notification:', {
        to: notification.to,
        message: notification.message,
        tenantId: this.tenantId,
      });

      // Example: Send SMS using your preferred SMS service
      // await this.smsProvider.send({
      //   to: notification.to,
      //   message: notification.message,
      //   from: this.tenantInfo.metadata?.smsNumber || '+1234567890',
      // });

    } catch (error) {
      console.error('Failed to send SMS:', error);
      throw error;
    }
  }

  async sendPushNotification(notification: PushNotification): Promise<void> {
    try {
      console.log('Sending push notification:', {
        userId: notification.userId,
        title: notification.title,
        tenantId: this.tenantId,
      });

      // Example: Send push notification using Firebase, OneSignal, etc.
      // await this.pushProvider.send({
      //   userId: notification.userId,
      //   title: notification.title,
      //   body: notification.body,
      //   data: {
      //     ...notification.data,
      //     tenantId: this.tenantId,
      //   },
      // });

    } catch (error) {
      console.error('Failed to send push notification:', error);
      throw error;
    }
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    try {
      const emailNotification: EmailNotification = {
        to: email,
        subject: 'Password Reset Request',
        template: 'password-reset',
        data: {
          resetUrl: `https://${this.tenantInfo.host}/reset-password?token=${resetToken}`,
          tenantName: this.tenantInfo.name,
          expiresIn: '1 hour',
        },
        priority: 'high',
      };

      await this.sendEmail(emailNotification);
      console.log(`Password reset email sent to ${email}`);
    } catch (error) {
      console.error('Failed to send password reset email:', error);
    }
  }

  async sendAccountVerificationEmail(email: string, verificationToken: string): Promise<void> {
    try {
      const emailNotification: EmailNotification = {
        to: email,
        subject: 'Verify Your Account',
        template: 'account-verification',
        data: {
          verificationUrl: `https://${this.tenantInfo.host}/verify?token=${verificationToken}`,
          tenantName: this.tenantInfo.name,
        },
        priority: 'high',
      };

      await this.sendEmail(emailNotification);
      console.log(`Account verification email sent to ${email}`);
    } catch (error) {
      console.error('Failed to send account verification email:', error);
    }
  }

  async sendBulkNotification(notifications: EmailNotification[]): Promise<void> {
    try {
      console.log(`Sending ${notifications.length} bulk notifications for tenant ${this.tenantId}`);

      // Example: Process notifications in batches
      const batchSize = 10;
      for (let i = 0; i < notifications.length; i += batchSize) {
        const batch = notifications.slice(i, i + batchSize);
        await Promise.all(batch.map(notification => this.sendEmail(notification)));
        
        // Add delay between batches to avoid rate limiting
        if (i + batchSize < notifications.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      console.log('Bulk notifications sent successfully');
    } catch (error) {
      console.error('Failed to send bulk notifications:', error);
      throw error;
    }
  }

  async getNotificationHistory(userId: string): Promise<any[]> {
    try {
      console.log(`Getting notification history for user ${userId}`);

      // Example: Query notification history from database
      // const repository = this.connection.getRepository('NotificationLog');
      // return repository.find({
      //   where: { userId, tenantId: this.tenantId },
      //   order: { createdAt: 'DESC' },
      //   take: 50,
      // });

      // Mock notification history
      return [
        {
          id: 'notif-1',
          type: 'email',
          subject: 'Welcome!',
          status: 'delivered',
          sentAt: new Date(),
        },
        {
          id: 'notif-2',
          type: 'push',
          title: 'New message',
          status: 'delivered',
          sentAt: new Date(),
        },
      ];
    } catch (error) {
      console.error('Failed to get notification history:', error);
      return [];
    }
  }

  async getNotificationPreferences(userId: string): Promise<any> {
    try {
      console.log(`Getting notification preferences for user ${userId}`);

      // Example: Get user notification preferences
      // const repository = this.connection.getRepository('UserPreferences');
      // return repository.findOne({
      //   where: { userId, tenantId: this.tenantId }
      // });

      // Mock preferences
      return {
        email: true,
        sms: false,
        push: true,
        marketing: false,
        security: true,
      };
    } catch (error) {
      console.error('Failed to get notification preferences:', error);
      return null;
    }
  }
}