import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FetchStatusData, LoginState } from '../types/FetchStatusData';
import { LoginDataSet } from '../types/LoginDataSet';
import '../styles/login.scss';
import resetAsset from '../assets/login/reset.png';
import tickAsset from '../assets/login/tick.png';
import GoogleAsset from '../assets/login/google.png';
import { RequestWrapper } from '../utils/RequestWrapper';
import TFACodeInput, { TCIState } from './utils/TFACodeInput';
import { useQuery } from '../utils/useQuery';
import { useLogin } from '../Providers/LoginProvider';

const Login = () => {
	const [dataSet, setDataSet] = useState<LoginDataSet>({
		h1: '',
		p: '',
		img: '',
	});
	const queryCode = useQuery().get('code');
	const history = useNavigate();
	const { loginStatus, refreshStatus } = useLogin();

	useEffect(() => {
		let isDone = false;
		(async () => {
			while (loginStatus.loggedIn !== LoginState.LOGGED && !isDone) {
				/* runs until the user is logged */
				await refreshStatus();
				await new Promise((resolve) =>
					setTimeout(() => resolve(0), 1500)
				);
			}
		})();
		return () => {
			isDone = true;
		};
	}, [loginStatus.loggedIn, refreshStatus]);

	useEffect(() => {
		if (!loginStatus.loggedIn && !queryCode) {
			window.open(
				(process.env.REACT_APP_BACKEND_ADDRESS as string) +
					'/auth/login',
				'Login 42',
				'scrollbars=no,resizable=no,' +
					'status=no,location=no,toolbar=no,menubar=no,width=500,height=600'
			);
			setDataSet({
				h1: 'Use the prompt to Log In',
				p: 'The login occurs in a popup.',
				img: resetAsset,
			});
		} else if (!loginStatus.loggedIn && queryCode) {
			setDataSet({
				h1: 'Logging In ...',
				p: 'Please wait a moment, this window will automatically close.',
				img: resetAsset,
			});
			(async () => {
				let failedReq: boolean = false;
				await RequestWrapper.get<FetchStatusData>(
					'/auth/login',
					{ params: { code: queryCode } },
					(e: any) => {
						failedReq = true;
						setDataSet({
							h1: 'Oops, an error happened :( !',
							p: e.message,
							img: 'error.png',
						});
					}
				);
				if (!failedReq) {
					setDataSet({
						h1: '42 login step is done !',
						p: 'The window will automatically close.',
						img: tickAsset,
					});
					window.close();
				}
			})();
		} else if (loginStatus.loggedIn === LoginState.LOGGED) {
			setDataSet({
				h1: 'You are logged in !',
				p: "Please wait a moment, you'll be redirected to your last location.",
				img: tickAsset,
			});
			(async () => {
				setTimeout(() => history('/'), 1000);
			})();
		}
	}, [history, loginStatus.loggedIn, queryCode]);

	return loginStatus.loggedIn === LoginState.PARTIAL && !queryCode ? (
		<div className="tfa-login-stuff">
			<img
				src={GoogleAsset}
				className="onthespot"
				alt="google auth logo"
			/>
			<div className="login-2fa-container">
				<TFACodeInput backResponse={(arg: TCIState) => {}} />
			</div>
		</div>
	) : (
		<div className="login-stuff">
			<h1>{dataSet.h1}</h1>
			{dataSet.p.length && <p>{dataSet.p}</p>}
			<img
				className={dataSet.img === tickAsset ? 'onthespot' : 'rotation'}
				src={dataSet.img}
				alt=""
			/>
		</div>
	);
};

export default Login;
