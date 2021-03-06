import { GameGateway } from './../game/game.gateway';
import { ChatGateway } from './../chat/chat.gateway';
import {
	ConflictException,
	forwardRef,
	HttpException,
	HttpStatus,
	Inject,
	Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EditUserDTO } from './dto/edit-user.dto';
import { FindUserDTO } from './dto/find-user.dto';
import { Like, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UserInterface, UserStatus } from './interface/UserInterface';
import { MatchHistoryDTO } from './dto/match-history.dto';
import download from './utils/download';
import { LadderDTO } from './dto/ladder.dto';
import { FriendDTO } from './dto/friend.dto';

@Injectable()
export class UserService {
	private userStatus: Map<number, UserStatus>;

	constructor(
		@InjectRepository(User) private userRepo: Repository<User>,
		@Inject(forwardRef(() => ChatGateway))
		private chatGateway: ChatGateway,
		private gameGateway: GameGateway
	) {
		this.userStatus = new Map<number, UserStatus>();
	}

	async createUser(details: UserInterface): Promise<User> {
		// download picture from 42 servers
		if (details.picture) {
			const path = `public/${details.login}.jpg`;
			const res = await download(details.picture, path);

			if (res) {
				// download successful
				details.picture = `${details.login}.jpg`;
			} else {
				// download failed, use default picture instead
				details.picture = undefined;
			}
		}

		const user = this.userRepo.create(details);
		return this.userRepo.save(user);
	}

	async findUserByLogin(login: string) {
		return this.userRepo.findOne({
			where: { login },
		});
	}

	async findUsersByDisplayName(loginFragment: string) {
		return await this.userRepo.find({
			where: {
				displayName: Like(`%${loginFragment}%`),
			},
		});
	}

	async findUserByDisplayName(name: string) {
		return this.userRepo.findOne({
			where: { displayName: name },
		});
	}

	async findUserById(id: number) {
		return this.userRepo.findOne({
			where: { id },
		});
	}

	async editUser(user: User, info: EditUserDTO, file?: Express.Multer.File) {
		if (file) user.picture = file.filename;
		if (info.username) {
			// find user with same username
			const userWithSameDisplayName = await this.userRepo.findOne({
				where: { displayName: info.username },
			});
			if (userWithSameDisplayName) {
				throw new ConflictException(
					'This display name is already taken'
				);
			}
			user.displayName = info.username;
		}
		if (info.twofa) user.twofa = info.twofa === 'true';
		return this.userRepo.save(user);
	}

	async getLadder() {
		const ladder: User[] = await this.userRepo.find({
			order: { elo: 'DESC' },
		});
		return ladder;
	}

	async getRank(user: User): Promise<number> {
		const ladder: User[] = await this.getLadder();
		return (
			ladder.findIndex((curr) => {
				return curr.id === user.id;
			}) + 1
		);
	}

	async createUserDTO(entity: User): Promise<FindUserDTO> {
		const dto = new FindUserDTO();

		dto.id = entity.id;
		dto.general.name = entity.displayName;
		dto.general.picture = entity.picture ? entity.picture : 'default.jpg';
		dto.general.creation = entity.createdAt;
		dto.general.status = await this.getUserStatus(entity);

		dto.ranking.vdRatio = [entity.victories, entity.losses];
		dto.ranking.elo = entity.elo;
		dto.ranking.rank = await this.getRank(entity);

		dto.history = await Promise.all(
			entity.history.map(async (match) => {
				const matchInfo = new MatchHistoryDTO();

				const players: User[] = await this.userRepo.findByIds([
					match.winnerId,
					match.loserId,
				]);

				if (players[0].id == match.winnerId) {
					matchInfo.winner = players[0].displayName;
					matchInfo.loser = players[1].displayName;
				} else {
					matchInfo.winner = players[1].displayName;
					matchInfo.loser = players[0].displayName;
				}

				matchInfo.id = match.id;
				matchInfo.score[0] = match.winScore;
				matchInfo.score[1] = match.loseScore;
				matchInfo.date = match.date;

				return matchInfo;
			})
		);

		// sort matches by date
		dto.history.sort((a, b) => {
			if (a.date > b.date) {
				return -1;
			} else {
				return 1;
			}
		});

		return dto;
	}

	async createLadderDTO(): Promise<LadderDTO[]> {
		const ladder = await this.getLadder();
		return ladder.map((user) => {
			const { id, displayName, elo } = user;
			const dto: LadderDTO = { id, displayName, elo };
			return dto;
		});
	}

	async getUserChannels(user: User) {
		const channels = (
			await this.userRepo.findOne({
				where: { id: user.id },
				relations: [
					'channels',
					'channels.owner',
					'channels.users',
					'channels.admins',
					'channels.messages',
					'channels.messages.user',
				],
			})
		)?.channels;

		if (!channels) return [];
		const blockedUsers = await this.getBlockedUsers(user);
		return Promise.all(
			channels.map((channel) =>
				channel.toDto(blockedUsers, user, (user) =>
					this.getUserStatus(user)
				)
			)
		);
	}

	async blockUser(user: User, blockedUser: User) {
		const userDB = await this.userRepo.findOne({
			where: { id: user.id },
			relations: ['blockedUsers'],
		});
		if (!userDB)
			throw new HttpException('User not found', HttpStatus.NOT_FOUND);
		userDB.blockedUsers.push(blockedUser);
		await this.userRepo.save(userDB);
	}

	async unblockUser(user: User, blockedUser: User) {
		const userDB = await this.userRepo.findOne({
			where: { id: user.id },
			relations: ['blockedUsers'],
		});
		if (!userDB)
			throw new HttpException('User not found', HttpStatus.NOT_FOUND);
		userDB.blockedUsers = userDB.blockedUsers.filter(
			(curr) => curr.id !== blockedUser.id
		);
		await this.userRepo.save(userDB);
	}

	async getBlockedUsers(user: { id: number }) {
		const userDB = await this.userRepo.findOne({
			where: { id: user.id },
			relations: ['blockedUsers'],
		});
		if (!userDB)
			throw new HttpException('User not found', HttpStatus.NOT_FOUND);
		return userDB.blockedUsers;
	}

	async getFriendslist(id: number): Promise<User[]> {
		const friends = (
			await this.userRepo.findOne({
				where: { id },
				relations: ['friends'],
			})
		)?.friends;

		if (!friends) {
			return [];
		}
		return friends;
	}

	async editFriendship(
		user: User,
		friend: User,
		cb: any
	): Promise<FriendDTO> {
		user.friends = await this.getFriendslist(user.id); // retrieve user's friend list

		// check the existing friendship relation between the two users
		const friendIndex = user.friends.findIndex((current) => {
			return current.id === friend.id;
		});

		// callback
		user = cb(user, friend, friendIndex);
		this.userRepo.save(user); // save new relation

		return FriendDTO.fromEntity(friend, (user) => this.getUserStatus(user));
	}

	async addFriend(user: User, friend: User) {
		return this.editFriendship(
			user,
			friend,
			(user: User, friend: User, index: number) => {
				if (index !== -1) {
					throw new ConflictException(
						`"${friend.displayName}" and you are already friends.`
					);
				} else if (user.id === friend.id) {
					throw new ConflictException(`You cannot add yourself !`);
				}
				user.friends.push(friend);
				return user;
			}
		);
	}

	async deleteFriend(user: User, friend: User) {
		this.editFriendship(
			user,
			friend,
			(user: User, friend: User, index: number) => {
				if (index === -1) {
					throw new ConflictException(
						`${friend.displayName} is not your friend.`
					);
				}
				user.friends.splice(index, 1);
				return user;
			}
		);
	}

	/*
	 ** This function check if status is stored and is not expired
	 ** if not stored and expired fetch it from services and set expiration date 
	 ** date + 10 seconds
+ 	 */
	async getUserStatus(user: { id: number }): Promise<UserStatus> {
		const fetchStatus = (userid: number): UserStatus => {
			if (this.gameGateway.isUserConnected(userid)) return 'ingame';
			if (this.chatGateway.isUserConnected(userid)) return 'online';
			return 'offline';
		};

		const found_status = this.userStatus.get(user.id);

		if (found_status) {
			// cached
			return found_status;
		}

		// not cached
		const status = fetchStatus(user.id);
		this.userStatus.set(user.id, status);

		// destroy the status after 10 seconds
		setTimeout(() => this.userStatus.delete(user.id), 500);
		return status;
	}
}
