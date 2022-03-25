import { useEffect, useRef } from "react";
import { ChatSocket } from "../../Providers/ChatProvider";
import { useLogin } from "../../Providers/LoginProvider";
import { MessageDto, User } from "./types/user-channels.dto";

const MessageArea = ({ index, chatSocket }: { index: number, chatSocket?: ChatSocket}) => {

	const { loginStatus } = useLogin();
	const messagesEndRef = useRef<HTMLDivElement>(null);
	let loginBuffer : string = "";

	const scrollToBottom = () => {
		if (messagesEndRef.current) {
			// fast scrool to bottom
			messagesEndRef.current.scrollIntoView();
		}
	}

	const msg_length = chatSocket?.channels[index].messages.length || 0;

	useEffect(() => {
		scrollToBottom();
	}, [msg_length]);

	const channel = chatSocket?.channels[index];

	if (!channel)
		return <div>No channel selected</div>;

	// transform channel.user to use user.id as key as users[id]
	const users = channel.users.reduce((acc, user) => {
		acc[user.id] = user;
		return acc;
	}, {} as { [id: number]: User });

	return (
		<div className="message-area">
			{
				channel?.messages.map((message: MessageDto, index: number) => {
					if (!index)
						loginBuffer = "";
					const displayName = message.userId && loginStatus.user?.id !== message.userId && users[message.userId].displayName as string !== loginBuffer ? users[message.userId as number].displayName : "";
					loginBuffer = message.userId ? users[message.userId].displayName : loginBuffer;
					return (
						<div className={message.messageType === 'system' ? "system" : ("user" + (loginStatus.user?.id === message.userId ? " self" : ''))} key={index}>
							{message.messageType !== 'system' && displayName && <p className="author">{displayName}</p>}
							<p className="message" ref={index === channel.messages.length - 1 ? messagesEndRef : undefined} >{message.text}</p>
						</div>
					);
				})
			}
		</div>
	);
}

export default MessageArea;
