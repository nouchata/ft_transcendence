import socketIOClient, { Socket } from "socket.io-client";
import { GameAction } from "./types/GameAction";
import { ResponseState } from "./types/ResponseState";



class GameWS {
	socket : Socket;
	instanceId : number;
	error : string | undefined;

	constructor(
		instanceId: number,
		stateCallback: (newState: ResponseState) => void,
		errorCallback: (e: any) => void
	) {
		this.instanceId = instanceId;

		this.socket = socketIOClient(
			process.env.REACT_APP_BACKEND_ADDRESS + '/game',
			{ withCredentials: true }
		);

		this.socket.on('exception', errorCallback);

		this.socket.on('stateUpdate', stateCallback);

		this.socket.emit('joinGame', { instanceId: this.instanceId });
	}

	emit(gameAction: GameAction) {
		this.socket.emit('gameActionDispatcher', { instanceId: this.instanceId, gameAction });
	}

	destroy() {
		this.socket.disconnect();
	}
};

export { GameWS };