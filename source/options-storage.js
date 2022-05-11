import OptionsSync from 'webext-options-sync';

export default new OptionsSync({
	defaults: {
		fontSize: 20,
		useFontSize: false,
		text: 'Set a text!',
	},
	migrations: [
		OptionsSync.migrations.removeUnused,
	],
	logging: true,
});
