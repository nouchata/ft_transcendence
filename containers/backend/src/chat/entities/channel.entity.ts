/* eslint-disable @typescript-eslint/no-unused-vars */
import { User } from 'src/user/entities/user.entity';
import { UserStatus } from 'src/user/interface/UserInterface';
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
import { ChannelDto } from '../dtos/user-channels.dto';
import { Message } from './message.entity';
import { Punishment } from './punishment.entity';

export type ChannelType = 'private' | 'protected' | 'public' | 'direct';

export interface BaseChannel {
	id: number;
	users: User[];
	messages: Message[];
	createdAt: Date;
	canUserAccess(user: User): boolean;
	canUserTalk(user: User): boolean;
	toDto(
		blockedUsers: User[],
		user: User,
		getUserStatus: (user: { id: number }) => Promise<UserStatus>
	): Promise<ChannelDto>;
}

export interface GroupChannel extends BaseChannel {
	name: string;
	channelType: 'public' | 'protected' | 'private';
	owner: User;
	admins: User[];
	punishments: Punishment[];
	isUserBanned(user: User): boolean;
	isUserMuted(user: User): boolean;
	getActivePunishment(user: User): Punishment | undefined;
	isUserAdmin(user: User): boolean;
}

export interface ProtectedChannel extends GroupChannel {
	channelType: 'protected';
	password_hash: string;
	password_salt: string;
}

export interface StandardChannel extends GroupChannel {
	channelType: 'public' | 'private';
	password_hash?: string;
	password_salt?: string;
}

export interface DirectChannel extends BaseChannel {
	channelType: 'direct';
}

export type IChannel = ProtectedChannel | StandardChannel | DirectChannel;

@Entity({ name: 'channels' })
export class Channel {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ nullable: true })
	name?: string;

	@Column()
	channelType: ChannelType;

	// optional column
	@Column({ nullable: true })
	password_hash?: string;

	@Column({ nullable: true })
	password_salt?: string;

	@ManyToOne((type) => User, { nullable: true })
	owner?: User;

	@ManyToMany((type) => User)
	@JoinTable()
	admins: User[];

	@ManyToMany((type) => User, (user) => user.channels, {
		onDelete: 'CASCADE',
	})
	users: User[];

	@OneToMany((type) => Punishment, (punishment) => punishment.channel, {
		onDelete: 'CASCADE',
	})
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

	async toDto(
		blockedUsers: User[],
		user: User,
		getUserStatus: (user: { id: number }) => Promise<UserStatus>
	): Promise<ChannelDto> {
		const channelDto: ChannelDto = {
			id: this.id,
			name:
				this.name ||
				this.users.find((u) => u.id !== user.id)?.displayName ||
				'',
			channelType: this.channelType,
			owner: await this.owner?.toDto(getUserStatus),
			users: await Promise.all(
				this.users.map((user) => user.toDto(getUserStatus))
			),
			admins: await Promise.all(
				this.admins.map((u) => u.toDto(getUserStatus))
			),
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
