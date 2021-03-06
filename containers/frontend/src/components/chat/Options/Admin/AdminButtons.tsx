import {
	faBan,
	faUserSlash,
	faVolumeXmark,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';
import { ChannelDto, User } from '../../types/user-channels.dto';
import { IUsePunishment } from '../../utils/usePunishment';
import Button from '../utils/Button';
import SanctionModal from './SanctionModal';
import SanctionLog from './SanctionsLog';

const KickButton = ({
	channel,
	user,
	punishmentsUtil,
}: {
	channel: ChannelDto;
	user: User;
	punishmentsUtil: IUsePunishment;
}) => {
	const [modalOpen, setModalOpen] = useState(false);

	return (
		<>
			<Button
				onClick={() => {
					setModalOpen(true);
				}}
				className="kick-button"
			>
				<FontAwesomeIcon icon={faUserSlash} className="icon" />
				Kick
			</Button>
			{modalOpen && (
				<SanctionModal
					punishmentType="kick"
					channel={channel}
					user={user}
					punishmentsUtil={punishmentsUtil}
					back={() => {
						setModalOpen(false);
					}}
				/>
			)}
		</>
	);
};

const MuteButton = ({
	channel,
	user,
	punishmentsUtil,
}: {
	channel: ChannelDto;
	user: User;
	punishmentsUtil: IUsePunishment;
}) => {
	const [modalOpen, setModalOpen] = useState(false);

	return (
		<>
			<Button
				onClick={() => {
					punishmentsUtil.getActivePunishement(user.id, 'mute')
						? punishmentsUtil.expirePunishementType(user.id, 'mute')
						: setModalOpen(true);
				}}
				className="mute-button"
			>
				<FontAwesomeIcon icon={faVolumeXmark} className="icon" />
				{punishmentsUtil.getActivePunishement(user.id, 'mute')
					? 'Unmute'
					: 'Mute'}
			</Button>
			{modalOpen && (
				<SanctionModal
					punishmentType={'mute'}
					channel={channel}
					user={user}
					punishmentsUtil={punishmentsUtil}
					back={() => {
						setModalOpen(false);
					}}
				/>
			)}
		</>
	);
};

const BanButton = ({
	channel,
	user,
	punishmentsUtil,
}: {
	channel: ChannelDto;
	user: User;
	punishmentsUtil: IUsePunishment;
}) => {
	const [modalOpen, setModalOpen] = useState(false);

	return (
		<>
			<Button
				onClick={() => {
					setModalOpen(true);
				}}
				className="ban-button"
			>
				<FontAwesomeIcon icon={faBan} className="icon" />
				Ban
			</Button>
			{modalOpen && (
				<SanctionModal
					punishmentType="ban"
					channel={channel}
					user={user}
					punishmentsUtil={punishmentsUtil}
					back={() => {
						setModalOpen(false);
					}}
				/>
			)}
		</>
	);
};

export const SeeSanctionsButton = ({
	user,
	punishmentsUtil,
}: {
	channel: ChannelDto;
	user: User;
	punishmentsUtil: IUsePunishment;
}) => {
	const [modalOpen, setModalOpen] = useState(false);

	return (
		<>
			<Button
				onClick={() => {
					setModalOpen(true);
				}}
				className="see-sanctions-button"
			>
				<FontAwesomeIcon icon={faBan} className="icon" />
				See sanctions log
			</Button>
			{modalOpen && (
				<SanctionLog
					punishements={punishmentsUtil.getUserPunishments(user.id)}
					back={() => {
						setModalOpen(false);
					}}
				/>
			)}
		</>
	);
};

const AdminButtons = ({
	channel,
	user,
	punishmentsUtil,
}: {
	channel: ChannelDto;
	user: User;
	punishmentsUtil: IUsePunishment;
}) => {
	return (
		<>
			<KickButton
				channel={channel}
				user={user}
				punishmentsUtil={punishmentsUtil}
			/>
			<MuteButton
				channel={channel}
				user={user}
				punishmentsUtil={punishmentsUtil}
			/>
			<BanButton
				channel={channel}
				user={user}
				punishmentsUtil={punishmentsUtil}
			/>
			{punishmentsUtil.getUserPunishments(user.id).length > 0 && (
				<SeeSanctionsButton
					channel={channel}
					user={user}
					punishmentsUtil={punishmentsUtil}
				/>
			)}
		</>
	);
};

export const UnBanButton = ({
	user,
	punishmentsUtil,
}: {
	channel: ChannelDto;
	user: User;
	punishmentsUtil: IUsePunishment;
}) => {
	return (
		<>
			<Button
				onClick={() => {
					punishmentsUtil.expirePunishementType(user.id, 'ban');
				}}
				className="ban-button"
			>
				<FontAwesomeIcon icon={faBan} className="icon" />
				Unban
			</Button>
		</>
	);
};

export default AdminButtons;
