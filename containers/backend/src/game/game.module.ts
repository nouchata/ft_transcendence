import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatModule } from 'src/chat/chat.module';
import { MatchHistory } from 'src/user/entities/match-history.entity';
import { User } from 'src/user/entities/user.entity';
import { GameController } from './game.controller';
import { GameGateway } from './game.gateway';
import { GameService } from './game.service';

@Module({
	imports: [TypeOrmModule.forFeature([User, MatchHistory]), ChatModule],
	controllers: [GameController],
	providers: [GameGateway, GameService],
	exports: [GameGateway],
})
export class GameModule {}
