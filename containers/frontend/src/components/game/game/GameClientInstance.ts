/* eslint-disable */

import { GameWS } from './GameWS';
import { RacketUnit } from './src/game_scene/racket/Racket';
import { TranscendanceApp } from './src/TranscendanceApp';
import { GameAction } from './types/GameAction';
import { ResponseState, RUNSTATE } from './types/ResponseState';
// import { PlayerRacket, RacketUnit } from './playerRacket';

enum GCI_STATE {
	SETUP,
	LOADED,
	RUNNING,
	ENDED,
	ERROR,
	WS_ERROR
};

class GameClientInstance {
	gciState: GCI_STATE = GCI_STATE.SETUP;
	app: TranscendanceApp;
	wsClient: GameWS;
	wsError: string | undefined;
	/* for the player of this instance if there is one */

	computedGameActions: { [actionId: number]: GameAction | undefined } = {};
	private lastCleanedCGAIndex: number = 0;

	lastLocalGameActionComputed: number = -1;
	lastlocalGameActionSended: number = -1;
	/* states */
	currentResponseState: ResponseState | undefined;
	// previousResponseState: ResponseState | undefined;
	currentServerTime: number = 0;
	private customResizeEvent: Event = new Event('resizeGame');

	private runState: RUNSTATE = RUNSTATE.WAITING;

	public playersAliases: Array<string> = [];

	constructor(userId: number, instanceId: number, forceSpectator: boolean) {
		this.wsClient = new GameWS(instanceId, forceSpectator, this.onSocketStateUpdate.bind(this), this.onSocketError.bind(this));

		this.app = new TranscendanceApp(
			this,
			userId,
			{
				view: document.getElementById("game-canvas") as HTMLCanvasElement,
				resolution: 1,
				resizeTo: document.getElementsByClassName("game-display").item(0) as HTMLElement,
				autoDensity: true,
				// backgroundColor: 0x6495ed,
				backgroundColor: 0x000000,
				width: 500,
				height: 500
			},
			forceSpectator
		);

		// custom event to save calcul processing by debouncing the resizing event
		window.addEventListener("resize", ((customResizeEvent: Event) => {
			let flag : number = 0;
			return (function() {
				if (flag) {
					window.clearTimeout(flag);
					flag = 0;
				}
				flag = setTimeout(() => window.dispatchEvent(customResizeEvent), 100) as unknown as number;
			});
		})(this.customResizeEvent));

		window.addEventListener("keydown", this.onKeyDown as EventListenerOrEventListenerObject);
		window.addEventListener("keyup", this.onKeyUp as EventListenerOrEventListenerObject);

		this.app.ticker.add(this.actionSender, this);

		setTimeout(() => window.dispatchEvent(new Event('resize')), 1000);
	}

	onSocketStateUpdate(newState: ResponseState) {
		this.currentResponseState = newState;
		if (this.currentResponseState.runState >= 3) {
			this.wsClient.destroy();
		}
		// cleaning for garbage collector
		if (this.app.playerRacket)
			this.computedGameActionsCleaner(
				this.app.playerRacket === RacketUnit.LEFT ?
				this.currentResponseState.playerOneLastActionProcessed :
				this.currentResponseState.playerTwoLastActionProcessed
			);
	}

	onSocketError(e: any) {
		this.gciState = GCI_STATE.WS_ERROR;
		this.wsError = e.message;
	}

	actionSender() {
		if (this.currentResponseState?.runState === RUNSTATE.RUNNING && this.app.playerRacket) {
			if (this.computedGameActions[this.lastlocalGameActionSended + 1]) {
				this.wsClient.emit(this.computedGameActions[this.lastlocalGameActionSended + 1] as GameAction);
				this.lastlocalGameActionSended++;
			}
		}
	}

	onKeyDown : Function = (function(this: GameClientInstance, e: KeyboardEvent) {
		if (this.app.playerRacket) {
			if (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === " ") {
				e.preventDefault();
				e.stopPropagation();
			}
			if (e.key === "ArrowUp")
				this.app.actualKeysPressed.up = true;
			else if (e.key === "ArrowDown")
				this.app.actualKeysPressed.down = true;
			else if (e.key === " ")
				this.app.actualKeysPressed.space = true;
		}
	}).bind(this);

	onKeyUp : Function = (function(this: GameClientInstance, e: KeyboardEvent) {
		if (this.app.playerRacket) {
			if (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === " ") {
				e.preventDefault();
				e.stopPropagation();
			}
			if (e.key === "ArrowUp")
				this.app.actualKeysPressed.up = false;
			else if (e.key === "ArrowDown")
				this.app.actualKeysPressed.down = false;
			else if (e.key === " ")
				this.app.actualKeysPressed.space = false;
		}
	}).bind(this);

	private async computedGameActionsCleaner(index: number) {
		let i: number = this.lastCleanedCGAIndex;
		this.lastCleanedCGAIndex = index;
		for (; i <= index ; i++)
			this.computedGameActions[i] = undefined;
	}

	destroy() {
		this.gciState = GCI_STATE.ENDED;
		window.removeEventListener("keydown", this.onKeyDown as EventListenerOrEventListenerObject);
		window.removeEventListener("keyup", this.onKeyUp as EventListenerOrEventListenerObject);
		this.app.destroy();
		this.wsClient.destroy();
	}
};

export { GameClientInstance, GCI_STATE };
