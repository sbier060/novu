import { SmsProviderIdEnum } from '@novu/shared';
import { ChannelTypeEnum, ISendMessageSuccessResponse, ISmsOptions, ISmsProvider } from '@novu/stateless';
import { BaseProvider, CasingEnum } from '../../../base.provider';
import { createProviderHttpClient } from '../../../utils/http';
import { WithPassthrough } from '../../../utils/types';

interface ITextKitMessageResponse {
  id: string;
  created_at?: string;
}

export class TextKitSmsProvider extends BaseProvider implements ISmsProvider {
  public static readonly BASE_URL = 'https://api.jointextkit.com/v1/messages';
  id = SmsProviderIdEnum.TextKit;
  channelType = ChannelTypeEnum.SMS as ChannelTypeEnum.SMS;
  protected casing = CasingEnum.SNAKE_CASE;
  private readonly httpClient = createProviderHttpClient();

  constructor(
    private config: {
      apiKey?: string;
      from?: string;
    }
  ) {
    super();
  }

  async sendMessage(
    options: ISmsOptions,
    bridgeProviderData: WithPassthrough<Record<string, unknown>> = {}
  ): Promise<ISendMessageSuccessResponse> {
    const data = this.transform<Record<string, unknown>>(bridgeProviderData, {
      to: options.to,
      from: options.from || this.config.from,
      body: options.content,
    });

    const response = await this.httpClient.post<ITextKitMessageResponse>(TextKitSmsProvider.BASE_URL, data.body, {
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        ...data.headers,
      },
    });

    return {
      id: response.data.id,
      date: response.data.created_at ?? new Date().toISOString(),
    };
  }
}
