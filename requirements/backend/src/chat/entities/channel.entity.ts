/* eslint-disable @typescript-eslint/no-unused-vars */
import { User } from 'src/user/entities/user.entity';
import {
	Column,
	CreateDateColumn,
	Entity,
	JoinTable,
	ManyToMany,
	ManyToOne,
	OneToMany,
	PrimaryGeneratedColumn,
} from 'typeorm';
import { ChannelType } from '../dtos/create-channel.dto';
import { ChannelDto, MessageDto } from '../dtos/user-channels.dto';
import { Message } from './message.entity';
import { Punishment } from './punishment.entity';

@Entity({ name: 'channels' })
export class Channel {
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	name: string;

	@Column()
	channelType: ChannelType;

	// optional column
	@Column({ nullable: true })
	password_hash: string;

	@Column({ nullable: true })
	password_salt: string;

	@ManyToOne((type) => User)
	owner: User;

	@ManyToMany((type) => User)
	@JoinTable()
	admins: User[];

	@ManyToMany((type) => User, (user) => user.channels, {
		onDelete: 'CASCADE',
	})
	users: User[];

	@OneToMany((type) => Punishment, (punishment) => punishment.channel)
	punishments: Punishment[];

	@OneToMany((type) => Message, (message) => message.channel, {
		onDelete: 'CASCADE',
	})
	messages: Message[];

	@CreateDateColumn()
	createdAt: Date;

	isUserBanned(user: User): boolean {
		if (
			this.punishments.some((punish) => {
				return (
					punish.user.id === user.id &&
					punish.type === 'ban' &&
					(!punish.expiration || punish.expiration > new Date())
				);
			})
		) {
			return true;
		}
		return false;
	}

	isUserMuted(user: User): boolean {
		if (
			this.punishments.some((punish) => {
				return (
					punish.user.id === user.id &&
					punish.type === 'mute' &&
					(!punish.expiration || punish.expiration > new Date())
				);
			})
		) {
			return true;
		}
		return false;
	}

	getActivePunishment(user: User) {
		return this.punishments.find((punishment) => {
			return (
				punishment.user.id === user.id &&
				(!punishment.expiration || punishment.expiration > new Date())
			);
		});
	}

	isUserAdmin(user: User): boolean {
		return this.admins.some((u) => u.id === user.id);
	}

	canUserAccess(user: User): boolean {
		if (!this.users.some((u) => u.id === user.id)) return false;

		if (this.isUserBanned(user)) return false;

		return true;
	}

	canUserTalk(user: User): boolean {
		if (!this.canUserAccess(user)) return false;

		if (
			this.punishments.some((punish) => {
				return (
					punish.user.id === user.id &&
					punish.type === 'mute' &&
					(!punish.expiration || punish.expiration > new Date())
				);
			})
		) {
			return false;
		}
		return true;
	}

	toDto(blockedUsers: User[]): ChannelDto {
		const channelDto: ChannelDto = {
			id: this.id,
			name: this.name,
			channelType: this.channelType,
			owner: this.owner.toDto(),
			users: this.users.map((user) => user.toDto()),
			admins: this.admins.map((u) => u.toDto()),
			messages: this.messages
				.filter((message) => {
					return !blockedUsers.find((user) => {
						return user.id === message.user?.id;
					});
				})
				.sort((a, b) => {
					return a.createdAt > b.createdAt ? 1 : -1;
				})
				.map((m) => m.toDto()),
		};
		return channelDto;
	}
}
