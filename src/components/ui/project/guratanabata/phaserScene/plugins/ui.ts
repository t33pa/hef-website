import Phaser from 'phaser';
import BBCode from 'phaser3-rex-plugins/plugins/bbcodetext';

export default class UI extends Phaser.Plugins.ScenePlugin {
	text(
		x: number,
		y: number,
		text: string,
		size = 16,
		maxWidth?: number,
		style = {},
		useBBCode = false,
	): Phaser.GameObjects.Text | BBCode {
		// @ts-expect-error Missing type
		return this.scene.add[useBBCode ? 'rexBBCodeText' : 'text'](x, y, text, {
			fontSize: `${size}px`,
			fontWeight: 'bold',
			fontFamily: '"Caveat Brush", "Patrick Hand", Arial, sans-serif',
			align: 'center',
			color: 'black',
			...(!useBBCode ? {
				wordWrap: {
					width: maxWidth,
					useAdvancedWrap: true,
				},
			} : {
				wrap: {
					mode: 1,
					width: maxWidth,
				},
			}),
			...style,
		});
	}

	// eslint-disable-next-line class-methods-use-this
	sleep(ms = 1000): Promise<void> {
		return new Promise((resolve) => {
			setTimeout(() => resolve(), ms);
		});
	}

	// eslint-disable-next-line class-methods-use-this
	clamp(num: number, min: number, max: number) {
		return Math.min(Math.max(num, min), max);
	}

	ensureOrientation() {
		try {
			// Watch for fullscreen and always lock to landscape
			this.game.scale.on('enterfullscreen', () => this.lock()).on('leavefullscreen', () => this.unlock());
			// Force fullscreen
			this.game.scale.startFullscreen();
		} catch {
			// eslint-disable-next-line no-console
			console.warn('Cannot lock orientation');
		}
	}

	lock() {
		if (!this.scene.game.device.os.desktop) {
			// @ts-expect-error
			try { ScreenOrientation.lock('landscape'); } catch {} // eslint-disable-line no-empty
			// eslint-disable-next-line no-empty
			try { window.screen.orientation.lock('landscape'); } catch {}
		}
	}

	// eslint-disable-next-line class-methods-use-this
	unlock() {
		if (!this.scene.game.device.os.desktop) {
			// @ts-expect-error
			try { ScreenOrientation.unlock(); } catch {} // eslint-disable-line no-empty
			// eslint-disable-next-line no-empty
			try { window.screen.orientation.unlock(); } catch {}
		}
	}

	// eslint-disable-next-line class-methods-use-this
	getPage(t: number, each: number, total = 10) {
		let page = 1;
		// eslint-disable-next-line no-plusplus
		for (let i = 1; i <= total; i++) {
			if (i * each >= t) {
				page = i;
				break;
			}
		}

		return page;
	}

	// eslint-disable-next-line class-methods-use-this
	shuffle(a: any[]) {
		let j;
		let x;

		// eslint-disable-next-line no-plusplus
		for (let i = a.length - 1; i > 0; i--) {
			j = Math.floor(Math.random() * (i + 1));
			x = a[i];
			// eslint-disable-next-line no-param-reassign
			a[i] = a[j];
			// eslint-disable-next-line no-param-reassign
			a[j] = x;
		}

		return a;
	}

	// eslint-disable-next-line class-methods-use-this
	convertTo2D(array: any[] = [], row = 2) {
		const newArr = [];
		const dupe = [...array];
		while (dupe.length) newArr.push(dupe.splice(0, row));

		return newArr;
	}
}
