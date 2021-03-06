import './Notifications.scss';
import close from '../../assets/chat/close.png';
import NotificationCenter from "./NotificationCenter";
import { useNotificationHandler } from "../../Providers/NotificationProvider";
import useWindowDimensions from '../utils/useWindowDimensions';

const Notifications = () => {
	const notificationHandler = useNotificationHandler();
	const windowDim = useWindowDimensions();

	const new_notif = notificationHandler?.notifications[0]
	return (
		<>
			{
				(notificationHandler?.numberOfNotifications as number > 0) && <NotificationCenter />
			}
			{
				notificationHandler?.show_new_notification && new_notif &&
				<div className='new-notification'>
					<div key={new_notif.uuid} className='notification'>
						{
							new_notif.image &&
							<img className='notification-image' src={new_notif.image} alt='notif-pic' />
						}
						<div className="notification-content">
							<div className='notification-title'>{new_notif.name}</div>
							<div className='notification-text'>{new_notif.content}</div>
						</div>
						{
							new_notif.openAction &&
							<div className='notification-action'>
								<div
									className='notification-open-action'
									onClick={() => {
										new_notif.openAction && new_notif.openAction(windowDim.width);
										notificationHandler?.removeNotificationContext('chat');
									}}
								>
									<div className='notification-open-action-text'>Open</div>
								</div>
							</div>
						}
						<img
							className='notification-close'
							src={close}
							alt='close'
							onClick={() => notificationHandler.removeNotification(new_notif.uuid)}
						/>

					</div>
				</div>
			}
		</>
	);
}


export default Notifications;
