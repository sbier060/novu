import { TextKitSmsProvider } from '@novu/providers';
import { ChannelTypeEnum, ICredentials, SmsProviderIdEnum } from '@novu/shared';
import { BaseSmsHandler } from './base.handler';

export class TextKitSmsHandler extends BaseSmsHandler {
  constructor() {
    super(SmsProviderIdEnum.TextKit, ChannelTypeEnum.SMS);
  }

  buildProvider(credentials: ICredentials) {
    this.provider = new TextKitSmsProvider({
      apiKey: credentials.apiKey,
      from: credentials.from,
    });
  }
}
