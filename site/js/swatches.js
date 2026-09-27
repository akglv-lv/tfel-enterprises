// Colour names from the print supplier -> dot colours for the product page.
// A name that isn't listed gets a neutral grey dot, so a new colour never breaks the page.
// Same list as theme/snippets/swatch-color.liquid.
const COLOURS = {
	black: "#111114",
	"vintage black": "#2E2D30",
	white: "#FFFFFF",
	navy: "#1F2640",
	"navy blazer": "#1F2640",
	maroon: "#5C1F2E",
	charcoal: "#46474D",
	"charcoal heather": "#46474D",
	"carbon grey": "#5C5E64",
	"dark grey": "#5C5E64",
	"sky blue": "#A9CDEB",
	sky: "#A9CDEB",
	"light blue": "#B9D6EE",
	"carolina blue": "#80B3E0",
	"harbor blue": "#3F6F90",
	"pacific blue": "#4C8FC3",
	"team royal": "#2148A6",
	royal: "#2148A6",
	purple: "#583A8A",
	"dusty rose": "#D6A29F",
	pink: "#F2A6C0",
	"light pink": "#F5C7D4",
	azalea: "#F28EB5",
	coral: "#F27A66",
	red: "#C21F2D",
	"team red": "#C21F2D",
	cardinal: "#8A1F32",
	cranberry: "#8A1F32",
	orange: "#EF7A2B",
	squash: "#F1A93B",
	"forest green": "#23442F",
	"military green": "#5A5E3C",
	spruce: "#2F4A3F",
	mint: "#AADFC8",
	bone: "#ECE3D1",
	natural: "#ECE3D1",
	sand: "#D6C8AA",
	stone: "#D6C8AA",
	"dark chocolate": "#3C2A22",
	"brown savana": "#8A6F56",
};

export function swatchColour(name) {
	return COLOURS[String(name).trim().toLowerCase()] || "#8E8C9E";
}
