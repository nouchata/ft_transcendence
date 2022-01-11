import { useState, useContext, useEffect } from 'react';
import LoadingContent from '../../LoadingContent';
import LoginContext from '../../contexts/LoginContext';
import ModalContext from '../../contexts/ModalContext';

import UserAsset from '../../assets/homepage/user.png';
import CloseAsset from '../../assets/chat/close.png';
import MaxAsset from '../../assets/chat/max.png';
import MinusAsset from '../../assets/chat/minus.png';
import ContainMaxAsset from '../../assets/chat/contain-max.png';
import HashAsset from '../../assets/social/hashtag.png';

import '../../styles/social_field.scss';

import { RequestWrapper } from '../../utils/RequestWrapper';
import { ChannelDto } from '../chat/types/user-channels.dto';
import { ChatSocket } from '../chat/utils/ChatSocket';
import { FetchStatusData } from '../../types/FetchStatusData';
import InputChat from '../chat/InputChat';
import MessageArea from '../chat/MessageArea';

type ChatState = {
	state: "OPENED" | "MINIMIZED" | "CLOSED",
};

let msgModalSettings = { show: true, content: <p>msg</p> };
let friendModalSettings = { show: true, content: <p>x</p> };

const HSocialField = (): JSX.Element => {
	const [isFriendTabSelected, setIsFriendTabSelected] = useState<boolean>(false);
	const [chatStatus, setChatStatus] = useState<ChatState>({ state: 'CLOSED' });
	const [isSocialFieldShowed, setIsSocialFieldShowed] = useState<boolean>(true);
	const { setModalProps } = useContext(ModalContext);
	const [channelsFetched, setChannelsFetched] = useState(false);
	const [chatSocket, setChatSocket] = useState<ChatSocket>();
	const [selectChannelIndex, setSelectChannelIndex] = useState<number>(0);
	const fetchStatusValue: {
		fetchStatus: FetchStatusData,
		setFetchStatus: (fetchStatus: FetchStatusData) => void
	} = useContext(LoginContext);



	useEffect(() => {
		const fetchChannels = async () => {
			const channels = await RequestWrapper.get<ChannelDto[]>('/user/channels/list');
			channels && setChatSocket(new ChatSocket(channels, { setChatSocket }, fetchStatusValue.fetchStatus.user));
		}
		if (!channelsFetched) {
			fetchChannels();
			setChannelsFetched(true);
		}
	}, [channelsFetched, fetchStatusValue.fetchStatus.user]);

	return (
		<div className='social-field'>
			<button
				title={isSocialFieldShowed ? 'Hide social panel' : 'Show social panel'}
				onClick={() => { socialToggleCSS(isSocialFieldShowed); setIsSocialFieldShowed(!isSocialFieldShowed); }}>
				{isSocialFieldShowed ? '<' : '>'}
			</button>
			<div className='hsf-tab-selector'>
				<button
					className={isFriendTabSelected ? 'hsf-btn-selected' : ''}
					onClick={() => !isFriendTabSelected && setIsFriendTabSelected(true)} >
					Friends
				</button>
				<button
					className={!isFriendTabSelected ? 'hsf-btn-selected' : ''}
					onClick={() => isFriendTabSelected && setIsFriendTabSelected(false)}>
					Channels
				</button>
			</div>
			<div className='hsf-content'>
				{isFriendTabSelected ?
					<LoadingContent widget={true} image={UserAsset} /> :
					<ul>
						{
							chatSocket?.channels.map((channel, index) => {
								return (
									<li
										key={index}
										onClick={() => {
											setSelectChannelIndex(index);
											setChatStatus({ state: 'OPENED' });
										}}
									>
										<figure>
											<img src={HashAsset} alt='Message Tab' className='hsf-content-channel-img' />
											<figcaption>{channel.name}</figcaption>
										</figure>
									</li>
								)
							})

						}
					</ul>}
			</div>

			<div className={chatToggleCSS(chatStatus)}>
				<div className='hsf-chat-controls'>
					<h2>{chatSocket?.channels[selectChannelIndex].name}</h2>
					<button title='Maximize in another window'><img src={MaxAsset} alt='maximize' /></button>

					{chatStatus.state === 'OPENED' ?
						<button title='Minimize' onClick={() => setChatStatus({ state: 'MINIMIZED' })}>
							<img src={MinusAsset} alt='minimize' />
						</button>
						:
						<button title='Maximize' onClick={() => setChatStatus({ state: 'OPENED' })}>
							<img src={ContainMaxAsset} alt='maximize-in' />
						</button>
					}

					<button title='Close' onClick={() => setChatStatus({ state: 'CLOSED' })}><img src={CloseAsset} alt='close' /></button>
				</div>
				<div className='hsf-chat-container'>
					<MessageArea index={selectChannelIndex} chatSocket={chatSocket} />
					<InputChat
						selectChannelIndex={selectChannelIndex}
						sendMessage={(text, channelIndex) => chatSocket?.sendMessage(text, channelIndex)} />
				</div>
			</div>

			<div className='hsf-btn-new'>
				<button onClick={() => setModalProps(isFriendTabSelected ? friendModalSettings : msgModalSettings)}>
					+ {isFriendTabSelected ? 'Add a new friend' : 'Create a new discussion'}
				</button>
			</div>
		</div>
	);
}

function chatToggleCSS(cs: ChatState): string {
	let ret: string = 'hsf-chat';
	switch (cs.state) {
		case "MINIMIZED":
			ret += ' minimize-state';
			break;
		case "CLOSED":
			ret += ' closed-state';
			break;
	}
	return (ret);
}

function socialToggleCSS(isShowed: boolean): void {
	let elem: Element | null = document.querySelector('.main-content');
	console.log(elem);
	(elem as HTMLElement).style.animation = 'none';
	setTimeout(() => {
		if (elem) {
			if (isShowed) {
				(elem as HTMLElement).style.animation = '1s ease-in-out 0s 1 normal both running hsf-slide';
			} else {
				(elem as HTMLElement).style.animation = '1s ease-in-out 0s 1 reverse both running hsf-slide';
			}
		}
	}, 0);
}

export default HSocialField;