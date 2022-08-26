import OptionsSync from 'webext-options-sync';

export default new OptionsSync({
	defaults: {
		fontSize: 20,
		useFontSize: false,
		text: 'Set a text!',
		level1AutoPlayTimeout: 4000,
		level2AutoPlayTimeout: 3000,
		level3AutoPlayTimeout: 2500,
		level4AutoPlayTimeout: 2000,
	},
	migrations: [
		OptionsSync.migrations.removeUnused,
	],
	logging: true,
});
