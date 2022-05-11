import withSolid from "rollup-preset-solid"
import { vanillaExtractPlugin } from "@vanilla-extract/rollup-plugin"
import alias from "@rollup/plugin-alias"
import path from "path"

export default withSolid({
	input: "src/index.tsx",
	plugins: [
		vanillaExtractPlugin(),
		alias({
			entries: {
				"@shared": path.resolve(__dirname, "..", "shared"),
				"@": path.resolve(__dirname, "src"),
			},
		}),
	],
})
