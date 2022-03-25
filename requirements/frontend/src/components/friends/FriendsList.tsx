import FriendRow from './FriendRow';
import ConfirmRemoveModal from './modal/ConfirmRemoveModal';

import '../../styles/friends_list.scss';
import '../../styles/social_field.scss';
import { FetchFriendsList } from '../../types/FetchFriendsList';
import { useFriendList } from '../../Providers/FriendListProvider';
import { useModal } from '../../Providers/ModalProvider';

const FriendsList = () => {
	const { setModalProps } = useModal();
	const friendList = useFriendList();
	const RemoveFriend = (friend: FetchFriendsList) => {
		const userConfirm = async (confirmed: boolean) => {
			if (confirmed) {
				friendList.removeFriend(friend.id);
			}
			setModalProps(undefined);
		};

		setModalProps({
			show: true,
			content: (
				<ConfirmRemoveModal
					name={friend.displayName}
					cb={userConfirm}
				/>
			),
			width: '40%',
			maxWidth: '500px',
		});
	};

	if (friendList.friends.length === 0) {
		return (
			<p className="friendslist-message">
				Sorry, it seems that you currently have no friends :(
			</p>
		);
	}

	return (
		<ul className="friendslist-container">
			{friendList.friends.map((friend) => {
				return (
					<FriendRow
						key={friend.id}
						onClick={() => RemoveFriend(friend)}
						data={friend}
					/>
				);
			})}
		</ul>
	);
};

export default FriendsList;
