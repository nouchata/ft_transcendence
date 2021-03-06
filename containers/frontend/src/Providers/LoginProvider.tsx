import { isEqual } from 'lodash';
import {
	createContext,
	ReactNode,
	useCallback,
	useContext,
	useEffect,
	useState,
} from 'react';
import { FetchStatusData, LoginState } from '../types/FetchStatusData';
import { RequestWrapper } from '../utils/RequestWrapper';

interface ILoginProvider {
	loginStatus: FetchStatusData;
	refreshStatus: () => Promise<boolean>;
	logout: () => Promise<void>;
}

const LoginContext = createContext<ILoginProvider | undefined>(undefined);

const useLogin = () => {
	const context = useContext(LoginContext);
	if (context === undefined) {
		throw new Error('useLogin must be used within a LoginProvider');
	}
	return context;
};

const LoginProvider = ({ children }: { children: ReactNode }) => {
	const [loginStatus, setLoginStatus] = useState<FetchStatusData>({
		loggedIn: LoginState.NOT_LOGGED,
		fetched: false,
	});
	const refreshStatus = useCallback(async (): Promise<boolean> => {
		let status_data: FetchStatusData = {
			loggedIn: LoginState.NOT_LOGGED,
			fetched: false,
		};
		const res = await RequestWrapper.get<FetchStatusData>('/auth/status');
		if (res) {
			status_data = res;
			res.fetched = true;
		}
		if (status_data.fetched) {
			if (!isEqual(loginStatus, status_data)) setLoginStatus(status_data);
			return true;
		}
		return false;
	}, []); // eslint-disable-line
	const logout = useCallback(async () => {
		const res = await RequestWrapper.get<FetchStatusData>('/auth/logout');
		if (res) {
			await 
			setLoginStatus({
				loggedIn: LoginState.NOT_LOGGED,
				fetched: false,
			});
		}
	}, []);

	useEffect(() => {
		(async () => {
			while (!loginStatus.fetched) {
				/* runs until first fetch of user data */
				if (await refreshStatus()) return;
				await new Promise((resolve) =>
					setTimeout(() => resolve(0), 1500)
				);
			}
		})();
	}, []); // eslint-disable-line

	return (
		<LoginContext.Provider
			value={{
				loginStatus,
				refreshStatus,
				logout,
			}}
		>
			{children}
		</LoginContext.Provider>
	);
};

export { LoginProvider, useLogin };
