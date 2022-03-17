import {
	faBan,
	faChevronLeft,
	faCircleNotch,
	faVolumeXmark,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';
import DateTimePicker from 'react-datetime-picker';
import { PunishmentType } from '../../types/punishment.dto';
import { ChannelDto, User } from '../../types/user-channels.dto';
import { IUsePunishment } from '../../utils/usePunishment';
import Button from '../utils/Button';

const SanctionModal = ({
	punishmentType,
	channel,
	user,
	punishmentsUtil,
	back,
}: {
	punishmentType: PunishmentType;
	channel: ChannelDto;
	user: User;
	punishmentsUtil: IUsePunishment;
	back: () => void;
}) => {
	const [date, setDate] = useState(new Date());
	const [reason, setReason] = useState('');
	const [banTemp, setBanTemp] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string>();

	return (
		<div className="sanction-modal">
			<FontAwesomeIcon
				icon={faChevronLeft}
				className="button-icon"
				onClick={back}
			/>
			<h2>Select time to {punishmentType}</h2>
			<div className="user-info">
				<img
					src={
						(process.env.REACT_APP_BACKEND_ADDRESS as string) +
						'/' +
						user.picture
					}
					alt=""
					className="user-image"
				/>
				<p>{user.displayName}</p>
			</div>
			<div className="input-group">
				<p>Reason (can be empty)</p>
				<input
					type="text"
					placeholder="Reason"
					value={reason}
					onChange={(e) => setReason(e.target.value)}
				/>
			</div>
			<div className="input-group">
				<p>Temporary ban</p>
				<input
					type="checkbox"
					checked={banTemp}
					onChange={(e) => setBanTemp(e.target.checked)}
				/>
				{banTemp && (
					<DateTimePicker
						onChange={setDate}
						value={date}
						className="date-picker"
					/>
				)}
			</div>

			<p className="error">{error}</p>
			<Button
				onClick={async () => {
					setIsLoading(true);
					try {
						await punishmentsUtil.addPunishment({
							userId: user.id,
							channelId: channel.id,
							type: punishmentType,
							expiration: banTemp
								? date.toISOString()
								: undefined,
							reason,
						});
						back();
					} catch (e) {
						setError(
							(e as any).response?.data?.message || 'Unknown error'
						);
						back();
					}
				}}
				className={`confirm ${punishmentType}-button`}
			>
				{!isLoading ? (
					punishmentType === 'mute' ? (
						<>
							<FontAwesomeIcon
								icon={faVolumeXmark}
								className="icon"
							/>
							Mute
						</>
					) : (
						<>
							<FontAwesomeIcon icon={faBan} className="icon" />
							Ban
						</>
					)
				) : (
					<FontAwesomeIcon
						icon={faCircleNotch}
						className="icon"
						spin
					/>
				)}
			</Button>
		</div>
	);
};

export default SanctionModal;
