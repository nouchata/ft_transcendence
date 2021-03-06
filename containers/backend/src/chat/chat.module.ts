import { UserModule } from 'src/user/user.module';
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { Channel } from './entities/channel.entity';
import { Message } from './entities/message.entity';
import { ChannelController } from './channel/channel.controller';
import { ChannelService } from './channel/channel.service';
import { ChatGateway } from './chat.gateway';
import { Punishment } from './entities/punishment.entity';

@Module({
	imports: [
		TypeOrmModule.forFeature([Message, Channel, User, Punishment]),
		forwardRef(() => UserModule),
	],
	controllers: [ChannelController],
	providers: [ChannelService, ChatGateway],
	exports: [ChannelService, ChatGateway],
})
export class ChatModule {}
