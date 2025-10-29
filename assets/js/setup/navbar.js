const HOVER_SOUND_ID = 'preloader-hover-sound';
const CLICK_SOUND_ID = 'preloader-click-sound';
const SECRET_SEQUENCE = ['A', 'P', 'I', 'S'];

const wait = (ms = 0) => new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));

const playSound = (audio) => {
	if (!audio) return;
	try {
		audio.currentTime = 0;
		const p = audio.play();
		if (p && typeof p.catch === 'function') {
			p.catch(err => {
				// Se il browser segnala che non ci sono sorgenti supportate, logghiamo un avviso
				if (err && err.name === 'NotSupportedError') {
					console.warn('[Navbar.playSound] Elemento audio senza sorgenti supportate:', audio);
				} else {
					// Altri errori (autoplay policy, ecc.) non vogliamo interrompere l'esperienza
					console.debug('[Navbar.playSound] Impossibile riprodurre audio:', err);
				}
			});
		}
	} catch (e) {
		// Ignora problemi sincroni (rari). Le rejection della promise sono gestite sopra.
	}
};

export function setupInteractiveNavbar({ autoReveal = true } = {}) {
	const header = document.getElementById('main-header');
	if (!header) {
		console.warn('[Navbar] Elemento <header id="main-header"> non trovato.');
		return { revealNav: () => {}, closeMenu: () => {}, destroy: () => {} };
	}

	const commands = Array.from(header.querySelectorAll('.console-command'));
	const readout = header.querySelector('.command-readout');
	const hamburger = header.querySelector('.console-hamburger');

	const mobileOverlay = document.getElementById('mobile-nav-overlay');
	const mobileClose = mobileOverlay?.querySelector('.mobile-close');
	const mobileLinks = Array.from(mobileOverlay?.querySelectorAll('.nav-link') || []);

	const hudElements = {
		status: header.querySelector('[data-hud="status"]'),
		link: header.querySelector('[data-hud="link"]'),
		sync: header.querySelector('[data-hud="sync"]')
	};

	const hoverSound = document.getElementById(HOVER_SOUND_ID);
	const clickSound = document.getElementById(CLICK_SOUND_ID);

	if (!readout) {
		console.warn('[Navbar] Elemento .command-readout non trovato.');
		return { revealNav: () => {}, closeMenu: () => {}, destroy: () => {} };
	}

	const defaultReadoutText = readout.dataset.default || '';

	const baselineHud = {
		status: 'ONLINE',
		link: 'STABILE',
		sync: '100%'
	};

	const commandHudPresets = {
		'#projects': { status: 'ONLINE', link: 'PROGETTI', sync: '96%' },
		'#about': { status: 'DOSSIER', link: 'PROFILO', sync: '92%' },
		'#contact': { status: 'CANALI', link: 'COMMS', sync: '88%' }
	};

	let activeCommand = null;
	let isMenuOpen = false;
	let bootCompleted = header.classList.contains('is-operational');
	let secretTimeoutId = null;
	let secretProgress = 0;

	const typingState = {
		timeoutId: null,
		resolve: null
	};

	const stopTyping = () => {
		if (typingState.timeoutId !== null) {
			clearTimeout(typingState.timeoutId);
			typingState.timeoutId = null;
		}
		if (typingState.resolve) {
			typingState.resolve();
			typingState.resolve = null;
		}
	};

	const typeReadoutText = (text, { speed = 28, jitter = 18 } = {}) => {
		stopTyping();
		readout.textContent = '';
		return new Promise((resolve) => {
			const characters = Array.from(text);
			let index = 0;
			typingState.resolve = resolve;

			const step = () => {
				if (typingState.resolve !== resolve) {
					resolve();
					return;
				}

				readout.textContent += characters[index];
				index += 1;

				if (index >= characters.length) {
					typingState.resolve = null;
					resolve();
					return;
				}

				const delay = Math.max(12, speed + Math.random() * jitter);
				typingState.timeoutId = setTimeout(step, delay);
			};

			step();
		});
	};

	const updateReadout = (text, { animate = false, speed = 26, jitter = 16 } = {}) => {
		if (!animate) {
			stopTyping();
			readout.textContent = text;
			return Promise.resolve();
		}
		return typeReadoutText(text, { speed, jitter });
	};

	const setHudValue = (key, value, { alert = false } = {}) => {
		const item = hudElements[key];
		if (!item) return;
		const valueEl = item.querySelector('.hud-value');
		if (valueEl && typeof value === 'string' && valueEl.textContent !== value) {
			valueEl.textContent = value;
		}
		item.classList.toggle('is-alert', alert);
	};

	const applyHudBaseline = () => {
		Object.entries(baselineHud).forEach(([key, value]) => {
			setHudValue(key, value, { alert: false });
		});
	};

	const applyCommandPreset = (targetId) => {
		applyHudBaseline();
		if (!targetId) return;
		const preset = commandHudPresets[targetId];
		if (!preset) return;
		Object.entries(preset).forEach(([key, value]) => {
			setHudValue(key, value, { alert: false });
		});
	};

	const clearSecretState = () => {
		if (secretTimeoutId) {
			clearTimeout(secretTimeoutId);
			secretTimeoutId = null;
		}
	};

	const setActiveCommand = (command) => {
		if (activeCommand === command) return;
		if (activeCommand) {
			activeCommand.classList.remove('is-active');
		}
		if (command) {
			command.classList.add('is-active');
		}
		activeCommand = command || null;
	};

	const handleCommandEnter = (command) => {
		if (!bootCompleted) return;
		playSound(hoverSound);
		command.classList.add('is-hover');
		updateReadout(command.dataset.label || '', { animate: false });
	};

	const handleCommandLeave = (command) => {
		command.classList.remove('is-hover');
		const fallbackText = activeCommand ? activeCommand.dataset.label : defaultReadoutText;
		updateReadout(fallbackText, { animate: false });
		if (activeCommand) {
			applyCommandPreset(activeCommand.dataset.target);
		} else {
			applyHudBaseline();
		}
	};

	const scrollToTarget = (targetId) => {
		if (!targetId) return;
		const targetElement = document.querySelector(targetId);
		if (targetElement) {
			targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	};

	const toggleMenu = (open) => {
		if (!hamburger || !mobileOverlay || !bootCompleted) return;
		isMenuOpen = typeof open === 'boolean' ? open : !isMenuOpen;
		hamburger.classList.toggle('is-active', isMenuOpen);
		hamburger.setAttribute('aria-expanded', String(isMenuOpen));
		mobileOverlay.classList.toggle('is-open', isMenuOpen);
		document.body.classList.toggle('no-scroll', isMenuOpen);
	};

	const handleCommandClick = (command, event) => {
		event.preventDefault();
		if (!bootCompleted) return;
		playSound(clickSound);
		clearSecretState();
		const targetId = command.dataset.target;
		setActiveCommand(command);
		applyCommandPreset(targetId);
		updateReadout(command.dataset.label || '', { animate: true, speed: 18, jitter: 12 });
		scrollToTarget(targetId);
		if (isMenuOpen) {
			toggleMenu(false);
		}
	};

	const triggerSecretProtocol = () => {
		if (!bootCompleted) return;
		playSound(clickSound);
		clearSecretState();
		setActiveCommand(null);
		setHudValue('status', 'ACCESSO', { alert: true });
		setHudValue('link', 'CIFRATO', { alert: true });
		setHudValue('sync', 'LOCK');
		updateReadout('PROTOCOLLO SEGRETO // A.P.I.S.', { animate: true, speed: 18, jitter: 10 }).then(() => {
			secretTimeoutId = setTimeout(() => {
				applyHudBaseline();
				updateReadout(defaultReadoutText, { animate: true, speed: 24, jitter: 14 });
			}, 3600);
		});
	};

	const eventListeners = [];

	commands.forEach((command) => {
		const onEnter = () => handleCommandEnter(command);
		const onLeave = () => handleCommandLeave(command);
		const onClick = (event) => handleCommandClick(command, event);

		command.addEventListener('mouseenter', onEnter);
		command.addEventListener('mouseleave', onLeave);
		command.addEventListener('click', onClick);

		eventListeners.push({ el: command, type: 'mouseenter', handler: onEnter });
		eventListeners.push({ el: command, type: 'mouseleave', handler: onLeave });
		eventListeners.push({ el: command, type: 'click', handler: onClick });
	});

	if (hamburger) {
		const onHamburgerClick = () => toggleMenu();
		hamburger.addEventListener('click', onHamburgerClick);
		eventListeners.push({ el: hamburger, type: 'click', handler: onHamburgerClick });
	}

	if (mobileClose) {
		const onMobileCloseClick = () => toggleMenu(false);
		mobileClose.addEventListener('click', onMobileCloseClick);
		eventListeners.push({ el: mobileClose, type: 'click', handler: onMobileCloseClick });
	}

	mobileLinks.forEach((link) => {
		const onMobileLinkClick = (event) => {
			event.preventDefault();
			if (!bootCompleted) return;
			playSound(clickSound);
			clearSecretState();
			const targetId = link.getAttribute('href');
			scrollToTarget(targetId);
			const desktopCommand = commands.find((cmd) => cmd.dataset.target === targetId);
			if (desktopCommand) {
				setActiveCommand(desktopCommand);
				applyCommandPreset(targetId);
				updateReadout(desktopCommand.dataset.label || '', { animate: true, speed: 18, jitter: 12 });
			}
			toggleMenu(false);
		};
		link.addEventListener('click', onMobileLinkClick);
		eventListeners.push({ el: link, type: 'click', handler: onMobileLinkClick });
	});

	const onReadoutDoubleClick = () => triggerSecretProtocol();
	readout.addEventListener('dblclick', onReadoutDoubleClick);
	eventListeners.push({ el: readout, type: 'dblclick', handler: onReadoutDoubleClick });

	const onKeydown = (event) => {
		if (!bootCompleted) return;
		const key = event.key?.toUpperCase();
		if (!key) return;
		if (key === SECRET_SEQUENCE[secretProgress]) {
			secretProgress += 1;
			if (secretProgress === SECRET_SEQUENCE.length) {
				triggerSecretProtocol();
				secretProgress = 0;
			}
		} else {
			secretProgress = 0;
		}
	};
	window.addEventListener('keydown', onKeydown);
	eventListeners.push({ el: window, type: 'keydown', handler: onKeydown });

	const runBootSequence = async () => {
		if (bootCompleted) {
			header.classList.add('is-visible');
			applyHudBaseline();
			updateReadout(defaultReadoutText);
			return;
		}

		header.classList.add('is-booting');
		header.classList.add('is-visible');

		setHudValue('status', 'BOOT', { alert: true });
		setHudValue('link', 'OFFLINE', { alert: true });
		setHudValue('sync', '5%', { alert: true });

		await wait(180);
		await updateReadout('INIZIALIZZAZIONE SISTEMA...', { animate: true, speed: 20, jitter: 12 });

		setHudValue('status', 'SCAN I/O', { alert: false });
		setHudValue('sync', '32%', { alert: false });
		await wait(240);
		await updateReadout('CALIBRAZIONE COMANDI ARCADE', { animate: true, speed: 20, jitter: 12 });

		setHudValue('link', 'STABILE', { alert: false });
		setHudValue('sync', '68%', { alert: false });
		await wait(260);
		await updateReadout('HANDSHAKE RETE A.P.I.S.', { animate: true, speed: 20, jitter: 12 });

		await wait(220);
		applyHudBaseline();
		await updateReadout(defaultReadoutText, { animate: true, speed: 24, jitter: 14 });

		header.classList.remove('is-booting');
		header.classList.add('is-operational');
		bootCompleted = true;
	};

	const revealNav = async (delay = 0, { skipBoot = false } = {}) => {
		await wait(delay);
		if (skipBoot) {
			header.classList.add('is-visible');
			header.classList.add('is-operational');
			bootCompleted = true;
			applyHudBaseline();
			updateReadout(defaultReadoutText);
			return;
		}
		await runBootSequence();
	};

	const closeMenu = () => {
		if (isMenuOpen) {
			toggleMenu(false);
		}
	};

	const destroy = () => {
		clearSecretState();
		stopTyping();
		closeMenu();
		eventListeners.forEach(({ el, type, handler }) => {
			el.removeEventListener(type, handler);
		});
		applyHudBaseline();
		updateReadout(defaultReadoutText);
	};

	applyHudBaseline();
	updateReadout(defaultReadoutText);

	if (autoReveal) {
		revealNav(350).catch(() => {});
	}

	return { revealNav, closeMenu, destroy };
}