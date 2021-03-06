import { FetchUserData } from '../../types/FetchUserData';
import HistoryTable from './HistoryTable';
import ProgressBar from '../utils/ProgressBar';
import { Link } from 'react-router-dom';
import UserStatus from '../utils/StatusDisplay';
import { BlockButton, FriendButton, WatchButton } from '../chat/Options/SocialButtons';
import { useEffect, useState } from 'react';
import { RequestWrapper } from '../../utils/RequestWrapper';

interface IProps {
	data: FetchUserData;
	onClick: () => void;
}

// convert date to DD/MM/YYYY
export const formatDate = (date: Date) => {
	const format2Digit = (n: number) => {
		if (n < 10) {
			return '0' + n.toString();
		} else {
			return n.toString();
		}
	};

	date = new Date(date);
	return `${format2Digit(date.getUTCDate())}/${format2Digit(
		date.getMonth() + 1
	)}/${date.getFullYear()}`;
};

export const getVictoryRatio = (victories: number, loses: number) => {
	const ratio = (victories * 100) / (victories + loses);

	if (!Number.isNaN(ratio)) {
		return Math.floor(ratio);
	} else {
		return 100; // avoid NaN value
	}
};

const UserDetails = (props: IProps) => {
	const [ instanceId, setInstanceId ] = useState<number | undefined>(undefined);
	// get the winrate of the user in percentage
	let ratio = getVictoryRatio(
		props.data.ranking.vdRatio[0],
		props.data.ranking.vdRatio[1]
	);

	// choose the right color for the user status
	const statusStyle = { color: 'red' };
	if (props.data.general.status === 'online') {
		statusStyle.color = 'green';
	} else if (props.data.general.status === 'ingame') {
		statusStyle.color = 'orange';
	}

	useEffect(() => {
		RequestWrapper
			.get<number>(`/game/player/state/${props.data.id}`)
			.then((value) => setInstanceId(value));
	}, []); // eslint-disable-line

	return (
		<div className="profile">
			<Link to="/homepage" className="return-button">
				Return to homepage
			</Link>
				<div className="social-option">
					{!props.data.isEditable && <>
						<BlockButton userId={props.data.id} />
						<FriendButton userId={props.data.id} />
					</> }
					{!!instanceId && <WatchButton instanceId={instanceId} />}
				</div>

			<div className="general-info">
				<img
					src={`${process.env.REACT_APP_BACKEND_ADDRESS}/${props.data.general.picture}`}
					alt="avatar of the user"
				/>

				<h1>
					{props.data.general.role} {props.data.general.name}
				</h1>

				<p>created on {formatDate(props.data.general.creation)}</p>
				<UserStatus status={props.data.general.status} />
			</div>

			<h2 className="separator">Ranking</h2>

			<span className="label1">victories</span>
			<span className="label2">loses</span>
			<div className="ratio">
				<div className="victory-count">
					{props.data.ranking.vdRatio[0]}
				</div>
				<ProgressBar color="green" bgcolor="red" completed={ratio} />
				<div className="lose-count">
					{props.data.ranking.vdRatio[1]}
				</div>
			</div>

			<div className="rank-info">
				<div>
					elo
					<br />
					{props.data.ranking.elo}
				</div>
				<div>
					rank
					<br />
					{props.data.ranking.rank}
				</div>
			</div>

			<h2 className="separator">History</h2>
			<div className="history">
				<HistoryTable data={props.data} />
			</div>
		</div>
	);
};

export default UserDetails;
