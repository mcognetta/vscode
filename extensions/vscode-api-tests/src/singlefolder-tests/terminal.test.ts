/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { window, Pseudoterminal, EventEmitter, TerminalDimensions, workspace, ConfigurationTarget, Disposable } from 'vscode';
import { doesNotThrow, equal, ok, deepEqual, throws } from 'assert';

suite('window namespace tests', () => {
	suiteSetup(async () => {
		// Disable conpty in integration tests because of https://github.com/microsoft/vscode/issues/76548
		await workspace.getConfiguration('terminal.integrated').update('windowsEnableConpty', false, ConfigurationTarget.Global);
	});
	suite('Terminal', () => {
		let disposables: Disposable[] = [];

		teardown(() => {
			disposables.forEach(d => d.dispose());
			disposables.length = 0;
		});

		test('sendText immediately after createTerminal should not throw', (done) => {
			disposables.push(window.onDidOpenTerminal(term => {
				try {
					equal(terminal, term);
				} catch (e) {
					done(e);
				}
				terminal.dispose();
				disposables.push(window.onDidCloseTerminal(() => done()));
			}));
			const terminal = window.createTerminal();
			doesNotThrow(terminal.sendText.bind(terminal, 'echo "foo"'));
		});

		test('onDidCloseTerminal event fires when terminal is disposed', (done) => {
			disposables.push(window.onDidOpenTerminal(term => {
				try {
					equal(terminal, term);
				} catch (e) {
					done(e);
				}
				terminal.dispose();
				disposables.push(window.onDidCloseTerminal(() => done()));
			}));
			const terminal = window.createTerminal();
		});

		test('processId immediately after createTerminal should fetch the pid', (done) => {
			disposables.push(window.onDidOpenTerminal(term => {
				try {
					equal(terminal, term);
				} catch (e) {
					done(e);
				}
				terminal.processId.then(id => {
					try {
						ok(id && id > 0);
					} catch (e) {
						done(e);
					}
					terminal.dispose();
					disposables.push(window.onDidCloseTerminal(() => done()));
				});
			}));
			const terminal = window.createTerminal();
		});

		test('name in constructor should set terminal.name', (done) => {
			disposables.push(window.onDidOpenTerminal(term => {
				try {
					equal(terminal, term);
				} catch (e) {
					done(e);
				}
				terminal.dispose();
				disposables.push(window.onDidCloseTerminal(() => done()));
			}));
			const terminal = window.createTerminal('a');
			try {
				equal(terminal.name, 'a');
			} catch (e) {
				done(e);
			}
		});

		test('creationOptions should be set and readonly for TerminalOptions terminals', (done) => {
			disposables.push(window.onDidOpenTerminal(term => {
				try {
					equal(terminal, term);
				} catch (e) {
					done(e);
				}
				terminal.dispose();
				disposables.push(window.onDidCloseTerminal(() => done()));
			}));
			const options = {
				name: 'foo',
				hideFromUser: true
			};
			const terminal = window.createTerminal(options);
			try {
				equal(terminal.name, 'foo');
				deepEqual(terminal.creationOptions, options);
				throws(() => (<any>terminal.creationOptions).name = 'bad', 'creationOptions should be readonly at runtime');
			} catch (e) {
				done(e);
			}
		});

		test('onDidOpenTerminal should fire when a terminal is created', (done) => {
			disposables.push(window.onDidOpenTerminal(term => {
				try {
					equal(term.name, 'b');
				} catch (e) {
					done(e);
				}
				disposables.push(window.onDidCloseTerminal(() => done()));
				terminal.dispose();
			}));
			const terminal = window.createTerminal('b');
		});

		test('exitStatus.code should be set to undefined after a terminal is disposed', (done) => {
			disposables.push(window.onDidOpenTerminal(term => {
				try {
					equal(term, terminal);
				} catch (e) {
					done(e);
				}
				disposables.push(window.onDidCloseTerminal(t => {
					try {
						deepEqual(t.exitStatus, { code: undefined });
					} catch (e) {
						done(e);
						return;
					}
					done();
				}));
				terminal.dispose();
			}));
			const terminal = window.createTerminal();
		});

		// test('onDidChangeActiveTerminal should fire when new terminals are created', (done) => {
		// 	const reg1 = window.onDidChangeActiveTerminal((active: Terminal | undefined) => {
		// 		equal(active, terminal);
		// 		equal(active, window.activeTerminal);
		// 		reg1.dispose();
		// 		const reg2 = window.onDidChangeActiveTerminal((active: Terminal | undefined) => {
		// 			equal(active, undefined);
		// 			equal(active, window.activeTerminal);
		// 			reg2.dispose();
		// 			done();
		// 		});
		// 		terminal.dispose();
		// 	});
		// 	const terminal = window.createTerminal();
		// 	terminal.show();
		// });

		// test('onDidChangeTerminalDimensions should fire when new terminals are created', (done) => {
		// 	const reg1 = window.onDidChangeTerminalDimensions(async (event: TerminalDimensionsChangeEvent) => {
		// 		equal(event.terminal, terminal1);
		// 		equal(typeof event.dimensions.columns, 'number');
		// 		equal(typeof event.dimensions.rows, 'number');
		// 		ok(event.dimensions.columns > 0);
		// 		ok(event.dimensions.rows > 0);
		// 		reg1.dispose();
		// 		let terminal2: Terminal;
		// 		const reg2 = window.onDidOpenTerminal((newTerminal) => {
		// 			// This is guarantees to fire before dimensions change event
		// 			if (newTerminal !== terminal1) {
		// 				terminal2 = newTerminal;
		// 				reg2.dispose();
		// 			}
		// 		});
		// 		let firstCalled = false;
		// 		let secondCalled = false;
		// 		const reg3 = window.onDidChangeTerminalDimensions((event: TerminalDimensionsChangeEvent) => {
		// 			if (event.terminal === terminal1) {
		// 				// The original terminal should fire dimension change after a split
		// 				firstCalled = true;
		// 			} else if (event.terminal !== terminal1) {
		// 				// The new split terminal should fire dimension change
		// 				secondCalled = true;
		// 			}
		// 			if (firstCalled && secondCalled) {
		// 				let firstDisposed = false;
		// 				let secondDisposed = false;
		// 				const reg4 = window.onDidCloseTerminal(term => {
		// 					if (term === terminal1) {
		// 						firstDisposed = true;
		// 					}
		// 					if (term === terminal2) {
		// 						secondDisposed = true;
		// 					}
		// 					if (firstDisposed && secondDisposed) {
		// 						reg4.dispose();
		// 						done();
		// 					}
		// 				});
		// 				terminal1.dispose();
		// 				terminal2.dispose();
		// 				reg3.dispose();
		// 			}
		// 		});
		// 		await timeout(500);
		// 		commands.executeCommand('workbench.action.terminal.split');
		// 	});
		// 	const terminal1 = window.createTerminal({ name: 'test' });
		// 	terminal1.show();
		// });

		suite('hideFromUser', () => {
			test('should be available to terminals API', done => {
				const terminal = window.createTerminal({ name: 'bg', hideFromUser: true });
				disposables.push(window.onDidOpenTerminal(t => {
					try {
						equal(t, terminal);
						equal(t.name, 'bg');
						ok(window.terminals.indexOf(terminal) !== -1);
					} catch (e) {
						done(e);
					}
					disposables.push(window.onDidCloseTerminal(() => {
						// reg3.dispose();
						done();
					}));
					terminal.dispose();
				}));
			});
		});

		suite('window.onDidWriteTerminalData', () => {
			test('should listen to all future terminal data events', (done) => {
				const openEvents: string[] = [];
				const dataEvents: { name: string, data: string }[] = [];
				const closeEvents: string[] = [];
				disposables.push(window.onDidOpenTerminal(e => openEvents.push(e.name)));

				let resolveOnceDataWritten: (() => void) | undefined;
				let resolveOnceClosed: (() => void) | undefined;

				disposables.push(window.onDidWriteTerminalData(e => {
					dataEvents.push({ name: e.terminal.name, data: e.data });

					resolveOnceDataWritten!();
				}));

				disposables.push(window.onDidCloseTerminal(e => {
					closeEvents.push(e.name);
					try {
						if (closeEvents.length === 1) {
							deepEqual(openEvents, ['test1']);
							deepEqual(dataEvents, [{ name: 'test1', data: 'write1' }]);
							deepEqual(closeEvents, ['test1']);
						} else if (closeEvents.length === 2) {
							deepEqual(openEvents, ['test1', 'test2']);
							deepEqual(dataEvents, [{ name: 'test1', data: 'write1' }, { name: 'test2', data: 'write2' }]);
							deepEqual(closeEvents, ['test1', 'test2']);
						}
						resolveOnceClosed!();
					} catch (e) {
						done(e);
					}
				}));

				const term1Write = new EventEmitter<string>();
				const term1Close = new EventEmitter<void>();
				window.createTerminal({
					name: 'test1', pty: {
						onDidWrite: term1Write.event,
						onDidClose: term1Close.event,
						open: async () => {
							term1Write.fire('write1');

							// Wait until the data is written
							await new Promise(resolve => { resolveOnceDataWritten = resolve; });

							term1Close.fire();

							// Wait until the terminal is closed
							await new Promise<void>(resolve => { resolveOnceClosed = resolve; });

							const term2Write = new EventEmitter<string>();
							const term2Close = new EventEmitter<void>();
							window.createTerminal({
								name: 'test2', pty: {
									onDidWrite: term2Write.event,
									onDidClose: term2Close.event,
									open: async () => {
										term2Write.fire('write2');

										// Wait until the data is written
										await new Promise<void>(resolve => { resolveOnceDataWritten = resolve; });

										term2Close.fire();

										// Wait until the terminal is closed
										await new Promise<void>(resolve => { resolveOnceClosed = resolve; });

										done();
									},
									close: () => { }
								}
							});
						},
						close: () => { }
					}
				});
			});
		});

		suite('Extension pty terminals', () => {
			test('should fire onDidOpenTerminal and onDidCloseTerminal', (done) => {
				disposables.push(window.onDidOpenTerminal(term => {
					try {
						equal(term.name, 'c');
					} catch (e) {
						done(e);
					}
					disposables.push(window.onDidCloseTerminal(() => done()));
					term.dispose();
				}));
				const pty: Pseudoterminal = {
					onDidWrite: new EventEmitter<string>().event,
					open: () => { },
					close: () => { }
				};
				window.createTerminal({ name: 'c', pty });
			});

			// The below tests depend on global UI state and each other
			// test('should not provide dimensions on start as the terminal has not been shown yet', (done) => {
			// 	const reg1 = window.onDidOpenTerminal(term => {
			// 		equal(terminal, term);
			// 		reg1.dispose();
			// 	});
			// 	const pty: Pseudoterminal = {
			// 		onDidWrite: new EventEmitter<string>().event,
			// 		open: (dimensions) => {
			// 			equal(dimensions, undefined);
			// 			const reg3 = window.onDidCloseTerminal(() => {
			// 				reg3.dispose();
			// 				done();
			// 			});
			// 			// Show a terminal and wait a brief period before dispose, this will cause
			// 			// the panel to init it's dimenisons and be provided to following terminals.
			// 			// The following test depends on this.
			// 			terminal.show();
			// 			setTimeout(() => terminal.dispose(), 200);
			// 		},
			// 		close: () => {}
			// 	};
			// 	const terminal = window.createTerminal({ name: 'foo', pty });
			// });
			// test('should provide dimensions on start as the terminal has been shown', (done) => {
			// 	const reg1 = window.onDidOpenTerminal(term => {
			// 		equal(terminal, term);
			// 		reg1.dispose();
			// 	});
			// 	const pty: Pseudoterminal = {
			// 		onDidWrite: new EventEmitter<string>().event,
			// 		open: (dimensions) => {
			// 			// This test depends on Terminal.show being called some time before such
			// 			// that the panel dimensions are initialized and cached.
			// 			ok(dimensions!.columns > 0);
			// 			ok(dimensions!.rows > 0);
			// 			const reg3 = window.onDidCloseTerminal(() => {
			// 				reg3.dispose();
			// 				done();
			// 			});
			// 			terminal.dispose();
			// 		},
			// 		close: () => {}
			// 	};
			// 	const terminal = window.createTerminal({ name: 'foo', pty });
			// });

			test('should respect dimension overrides', (done) => {
				disposables.push(window.onDidOpenTerminal(term => {
					try {
						equal(terminal, term);
					} catch (e) {
						done(e);
					}
					term.show();
					disposables.push(window.onDidChangeTerminalDimensions(e => {
						if (e.dimensions.columns === 0 || e.dimensions.rows === 0) {
							// HACK: Ignore the event if dimension(s) are zero (#83778)
							return;
						}
						try {
							equal(e.dimensions.columns, 10);
							equal(e.dimensions.rows, 5);
							equal(e.terminal, terminal);
						} catch (e) {
							done(e);
						}
						disposables.push(window.onDidCloseTerminal(() => done()));
						terminal.dispose();
					}));
				}));
				const writeEmitter = new EventEmitter<string>();
				const overrideDimensionsEmitter = new EventEmitter<TerminalDimensions>();
				const pty: Pseudoterminal = {
					onDidWrite: writeEmitter.event,
					onDidOverrideDimensions: overrideDimensionsEmitter.event,
					open: () => overrideDimensionsEmitter.fire({ columns: 10, rows: 5 }),
					close: () => { }
				};
				const terminal = window.createTerminal({ name: 'foo', pty });
			});

			test('exitStatus.code should be set to the exit code (undefined)', (done) => {
				disposables.push(window.onDidOpenTerminal(term => {
					try {
						equal(terminal, term);
						equal(terminal.exitStatus, undefined);
					} catch (e) {
						done(e);
					}
					disposables.push(window.onDidCloseTerminal(t => {
						try {
							equal(terminal, t);
							deepEqual(terminal.exitStatus, { code: undefined });
						} catch (e) {
							done(e);
							return;
						}
						done();
					}));
				}));
				const writeEmitter = new EventEmitter<string>();
				const closeEmitter = new EventEmitter<number | undefined>();
				const pty: Pseudoterminal = {
					onDidWrite: writeEmitter.event,
					onDidClose: closeEmitter.event,
					open: () => closeEmitter.fire(),
					close: () => { }
				};
				const terminal = window.createTerminal({ name: 'foo', pty });
			});

			test('exitStatus.code should be set to the exit code (zero)', (done) => {
				disposables.push(window.onDidOpenTerminal(term => {
					try {
						equal(terminal, term);
						equal(terminal.exitStatus, undefined);
					} catch (e) {
						done(e);
					}
					disposables.push(window.onDidCloseTerminal(t => {
						try {
							equal(terminal, t);
							deepEqual(terminal.exitStatus, { code: 0 });
						} catch (e) {
							done(e);
							return;
						}
						done();
					}));
				}));
				const writeEmitter = new EventEmitter<string>();
				const closeEmitter = new EventEmitter<number | undefined>();
				const pty: Pseudoterminal = {
					onDidWrite: writeEmitter.event,
					onDidClose: closeEmitter.event,
					open: () => closeEmitter.fire(0),
					close: () => { }
				};
				const terminal = window.createTerminal({ name: 'foo', pty });
			});

			test('exitStatus.code should be set to the exit code (non-zero)', (done) => {
				disposables.push(window.onDidOpenTerminal(term => {
					try {
						equal(terminal, term);
						equal(terminal.exitStatus, undefined);
					} catch (e) {
						done(e);
					}
					disposables.push(window.onDidCloseTerminal(t => {
						try {
							equal(terminal, t);
							deepEqual(terminal.exitStatus, { code: 22 });
						} catch (e) {
							done(e);
							return;
						}
						done();
					}));
				}));
				const writeEmitter = new EventEmitter<string>();
				const closeEmitter = new EventEmitter<number | undefined>();
				const pty: Pseudoterminal = {
					onDidWrite: writeEmitter.event,
					onDidClose: closeEmitter.event,
					open: () => closeEmitter.fire(22),
					close: () => { }
				};
				const terminal = window.createTerminal({ name: 'foo', pty });
			});

			test('creationOptions should be set and readonly for ExtensionTerminalOptions terminals', (done) => {
				disposables.push(window.onDidOpenTerminal(term => {
					try {
						equal(terminal, term);
					} catch (e) {
						done(e);
					}
					terminal.dispose();
					disposables.push(window.onDidCloseTerminal(() => done()));
				}));
				const writeEmitter = new EventEmitter<string>();
				const pty: Pseudoterminal = {
					onDidWrite: writeEmitter.event,
					open: () => { },
					close: () => { }
				};
				const options = { name: 'foo', pty };
				const terminal = window.createTerminal(options);
				try {
					equal(terminal.name, 'foo');
					deepEqual(terminal.creationOptions, options);
					throws(() => (<any>terminal.creationOptions).name = 'bad', 'creationOptions should be readonly at runtime');
				} catch (e) {
					done(e);
				}
			});
		});
	});
});
