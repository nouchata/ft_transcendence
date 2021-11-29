import { useState, useEffect, useContext, useMemo } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import LoginContext from './LoginContext';
import { FetchStatusData } from './types/FetchStatusData';
import { LoginDataSet } from './types/LoginDataSet';
import Axios from 'axios';
// not-package-related importation
import './styles/login.scss';
import resetAsset from './assets/login/reset.png';
import tickAsset from './assets/login/tick.png';

const Login = () =>
{
	let [ dataSet, setDataSet ] = useState<LoginDataSet>({ h1: '', p: '', img: '' });
	let queryCode = useQuery().get('code');
	let history = useHistory();
	let [ cookie, setCookie ] = useContext(LoginContext);

	useEffect(() => {
		if (cookie === false && !queryCode) {
			window.open(process.env.REACT_APP_BACKEND_ADDRESS as string + 
				process.env.REACT_APP_BACKEND_LOGIN as string, 'Login 42', 'scrollbars=no,resizable=no,' +
				'status=no,location=no,toolbar=no,menubar=no,width=500,height=600');
			setDataSet({ 
				h1: 'Use the prompt to Log In',
				p: 'The login occurs in a popup.',
				img: resetAsset
			});
			(async() => {
				let flag = true;
				while (flag) {
					try {
						let res : FetchStatusData = await new Promise((resolve) => 
						setTimeout(() => 
						resolve(Axios.get(process.env.REACT_APP_BACKEND_ADDRESS as string + 
							process.env.REACT_APP_BACKEND_FETCH_USER as string, 
							{ withCredentials: true })), 1000)
						);
        				if (res.data.loggedIn)
							flag = false;
					} catch {}
				}
				setCookie(true);
				setDataSet({ 
					h1: 'You are logged in !',
					p: 'Please wait a moment, you\'ll be redirected to your last location.',
					img: tickAsset
				});
				setTimeout(() => history.goBack(), 2000);
			})();
		} else if (cookie === false && queryCode) {
			setDataSet({ 
				h1: 'Logging In ...',
				p: 'Please wait a moment, this window will automatically close.',
				img: resetAsset
			});
			(async() => {
				try {
					await Axios.get(process.env.REACT_APP_BACKEND_ADDRESS as string + 
						process.env.REACT_APP_BACKEND_LOGIN as string, 
						{withCredentials: true, params: {code: queryCode}}
					);
					setDataSet({ 
						h1: 'You are logged in !',
						p: 'The window will automatically close.',
						img: tickAsset
					});
					setCookie(true);
					setTimeout(() => window.close(), 1000);
				} catch {
					setDataSet({ 
						h1: 'Oops, an error happened :( !',
						p: '',
						img: 'error.png'
					});
				}
			})();
		} else {
			setDataSet({ 
				h1: 'You are logged in !',
				p: 'Please wait a moment, you\'ll be redirected to your last location.',
				img: tickAsset
			});
			(async() => {
				setTimeout(() => history.goBack(), 2000);
			})();
		}
	}, []);

	return (
		<div className="login-stuff">
			<h1>{dataSet.h1}</h1>
			{dataSet.p.length && <p>{dataSet.p}</p>}
			<img className={dataSet.img === tickAsset ? "onthespot" : "rotation"} src={dataSet.img} alt="" />
		</div>
	);
}

function useQuery() {
	const { search } = useLocation();
	return useMemo(() => new URLSearchParams(search), [search]);
}

export default Login;