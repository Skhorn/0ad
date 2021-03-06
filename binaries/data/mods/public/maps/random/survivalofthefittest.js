RMS.LoadLibrary("rmgen");

var random_terrain = randomizeBiome();

const tMainTerrain = rBiomeT1();
const tForestFloor1 = rBiomeT2();
const tForestFloor2 = rBiomeT3();
const tCliff = rBiomeT4();
const tHill = rBiomeT8();
const tTier1Terrain = rBiomeT5();
const tTier2Terrain = rBiomeT6();
const tTier3Terrain = rBiomeT7();
const tTier4Terrain = rBiomeT12();

// gaia entities
const oTree1 = rBiomeE1();
const oTree2 = rBiomeE2();
const oTree3 = rBiomeE3();
const oTree4 = rBiomeE4();
const oTree5 = rBiomeE5();

// decorative props
const aGrass = rBiomeA1();
const aGrassShort = rBiomeA2();
const aRockLarge = rBiomeA5();
const aRockMedium = rBiomeA6();
const aBushMedium = rBiomeA7();
const aBushSmall = rBiomeA8();
const aWaypointFlag = "actor|props/special/common/waypoint_flag.xml";

const pForest1 = [tForestFloor2 + TERRAIN_SEPARATOR + oTree1, tForestFloor2 + TERRAIN_SEPARATOR + oTree2, tForestFloor2];
const pForest2 = [tForestFloor1 + TERRAIN_SEPARATOR + oTree4, tForestFloor1 + TERRAIN_SEPARATOR + oTree5, tForestFloor1];

const oTreasureSeeker = "skirmish/units/default_support_female_citizen";
const oCivicCenter = "skirmish/structures/default_civil_centre";
const oCitizenInfantry = "skirmish/units/default_infantry_melee_b";

const triggerPointAttacker = "special/trigger_point_A";
const triggerPointTreasures = [
	"special/trigger_point_B",
	"special/trigger_point_C",
	"special/trigger_point_D"
];

log("Initializing map...");
InitMap();

var numPlayers = getNumPlayers();
var mapSize = getMapSize();

var clPlayer = createTileClass();
var clHill = createTileClass();
var clForest = createTileClass();
var clDirt = createTileClass();
var clBaseResource = createTileClass();
var clLand = createTileClass();
var clWomen = createTileClass();

for (var ix = 0; ix < mapSize; ix++)
	for (var iz = 0; iz < mapSize; iz++)
		placeTerrain(ix, iz, tMainTerrain);

var ix = Math.round(fractionToTiles(0.5));
var iz = Math.round(fractionToTiles(0.5));

// Create the main treasure area in the middle of the map
createArea(
	new ClumpPlacer(mapSize * mapSize * scaleByMapSize(0.065, 0.09), 0.7, 0.1, 10, ix, iz),
	[
		new LayeredPainter([tMainTerrain, tMainTerrain], [3]),
		new SmoothElevationPainter(ELEVATION_SET, 3, 3),
		paintClass(clLand)
	],
	null);

// randomize player order
var playerIDs = [];
for (var i = 0; i < numPlayers; i++)
	playerIDs.push(i+1);
playerIDs = sortPlayers(playerIDs);

// place players
var playerX = new Array(numPlayers);
var playerZ = new Array(numPlayers);
var attackerX = new Array(numPlayers);
var attackerZ = new Array(numPlayers);
var playerAngle = new Array(numPlayers);

var startAngle = randFloat(0, 2 * PI);
for (let  i = 0; i < numPlayers; ++i)
{
	playerAngle[i] = startAngle + i * 2 * PI / numPlayers;
	playerX[i] = 0.5 + 0.3*cos(playerAngle[i]);
	playerZ[i] = 0.5 + 0.3*sin(playerAngle[i]);
	attackerX[i] = 0.5 + 0.45*cos(playerAngle[i]);
	attackerZ[i] = 0.5 + 0.45*sin(playerAngle[i]);
}

for (let i = 0; i < numPlayers; ++i)
{
	var id = playerIDs[i];
	log("Creating base for player " + id + "...");

	var radius = scaleByMapSize(15, 25);

	// place the attacker spawning trigger point
	var ax = round(fractionToTiles(attackerX[i]));
	var az = round(fractionToTiles(attackerZ[i]));
	placeObject(ax, az, triggerPointAttacker, id, PI);
	placeObject(ax, az, aWaypointFlag, 0, PI/2);
	addToClass(ax, az, clPlayer);
	addToClass(round(fractionToTiles((attackerX[i] + playerX[i]) / 2)), round(fractionToTiles((attackerZ[i] + playerZ[i]) / 2)), clPlayer);

	// get the x and z in tiles
	let fx = fractionToTiles(playerX[i]);
	let fz = fractionToTiles(playerZ[i]);
	let ix = round(fx);
	let iz = round(fz);

	addToClass(ix, iz, clPlayer);
	addToClass(ix+5, iz, clPlayer);
	addToClass(ix, iz+5, clPlayer);
	addToClass(ix-5, iz, clPlayer);
	addToClass(ix, iz-5, clPlayer);

	// Place default civ starting entities
	var uDist = 6;
	var uSpace = 2;
	placeObject(fx, fz, oCivicCenter, id, BUILDING_ORIENTATION);
	var uAngle = BUILDING_ORIENTATION - PI / 2;
	var count = 4;
	for (let numberofentities = 0; numberofentities < count; ++numberofentities)
	{
		var ux = fx + uDist * cos(uAngle) + numberofentities * uSpace * cos(uAngle + PI/2) - (0.75 * uSpace * floor(count / 2) * cos(uAngle + PI/2));
		var uz = fz + uDist * sin(uAngle) + numberofentities * uSpace * sin(uAngle + PI/2) - (0.75 * uSpace * floor(count / 2) * sin(uAngle + PI/2));
		placeObject(ux, uz, oCitizenInfantry, id, uAngle);
	}

	placeDefaultDecoratives(fx, fz, aGrassShort, clBaseResource, radius);

	var tang = startAngle + (i + 0.5) * 2 * PI / numPlayers;

	var placer = new PathPlacer(
		fractionToTiles(0.5),
		fractionToTiles(0.5),
		fractionToTiles(0.5 + 0.5 * Math.cos(tang)),
		fractionToTiles(0.5 + 0.5 * Math.sin(tang)),
		scaleByMapSize(14, 24),
		0.4,
		3 * scaleByMapSize(1, 3),
		0.2,
		0.05);

	createArea(
		placer,
		[
			new LayeredPainter([tMainTerrain, tMainTerrain], [1]),
			new SmoothElevationPainter(ELEVATION_SET, 3, 4)
		],
		null);

	var femaleLocation = getTIPIADBON([ix, iz], [mapSize / 2, mapSize / 2], [-3 , 3.5], 1, 3);
	if (femaleLocation !== undefined)
	{
		placeObject(femaleLocation[0], femaleLocation[1], oTreasureSeeker, id, playerAngle[i] + PI);
		addToClass(floor(femaleLocation[0]), floor(femaleLocation[1]), clWomen);
	}
}

paintTerrainBasedOnHeight(3.12, 29, 1, tCliff);
paintTileClassBasedOnHeight(3.12, 29, 1, clHill);

for (let triggerPointTreasure of triggerPointTreasures)
	createObjectGroupsDeprecated(
		new SimpleGroup([new SimpleObject(triggerPointTreasure, 1, 1, 0, 0)], true, clWomen),
		0,
		[avoidClasses(clForest, 5, clPlayer, 5, clHill, 5), stayClasses(clLand, 5)],
		scaleByMapSize(40, 140), 100
	);

createBumps(stayClasses(clLand, 5));

createForests(
	[tMainTerrain, tForestFloor1, tForestFloor2, pForest1, pForest2],
	[avoidClasses(clPlayer, 20, clForest, 5, clHill, 0, clBaseResource,2, clWomen, 5), stayClasses(clLand, 4)],
	clForest,
	1,
	random_terrain
);

if (randBool())
	createHills(
		[tMainTerrain, tCliff, tHill],
		[avoidClasses(clPlayer, 20, clHill, 5, clBaseResource, 3, clWomen, 5), stayClasses(clLand, 5)],
		clHill,
		scaleByMapSize(10, 60) * numPlayers);
else
	createMountains(
		tCliff,
		[avoidClasses(clPlayer, 20, clHill, 5, clBaseResource, 3, clWomen, 5), stayClasses(clLand, 5)],
		clHill,
		scaleByMapSize(10, 60) * numPlayers);

createHills(
	[tCliff, tCliff, tHill],
	avoidClasses(clPlayer, 20, clHill, 5, clBaseResource, 3, clWomen, 5, clLand, 5),
	clHill,
	scaleByMapSize(15, 90) * numPlayers,
	undefined,
	undefined,
	undefined,
	undefined,
	55);

RMS.SetProgress(50);

log("Creating dirt patches...");
createLayeredPatches(
	[scaleByMapSize(3, 6), scaleByMapSize(5, 10), scaleByMapSize(8, 21)],
	[[tMainTerrain, tTier1Terrain], [tTier1Terrain, tTier2Terrain], [tTier2Terrain, tTier3Terrain]],
	[1, 1],
	[avoidClasses(clForest, 0, clHill, 0, clDirt, 5, clPlayer, 12, clWomen, 5), stayClasses(clLand, 5)]
);

log("Creating grass patches...");
createPatches(
	[scaleByMapSize(2, 4), scaleByMapSize(3, 7), scaleByMapSize(5, 15)],
	tTier4Terrain,
	[avoidClasses(clForest, 0, clHill, 0, clDirt, 5, clPlayer, 12, clWomen, 5), stayClasses(clLand, 5)]
);

var planetm = 1;
if (random_terrain == g_BiomeTropic)
	planetm = 8;

createDecoration(
	[
		[new SimpleObject(aRockMedium, 1, 3, 0, 1)],
		[new SimpleObject(aRockLarge, 1, 2, 0, 1), new SimpleObject(aRockMedium, 1, 3, 0, 2)],
		[new SimpleObject(aGrassShort, 1, 2, 0, 1, -PI/8, PI/8)],
		[new SimpleObject(aGrass, 2,4, 0, 1.8, -PI/8, PI/8), new SimpleObject(aGrassShort, 3,6, 1.2, 2.5, -PI/8, PI/8)],
		[new SimpleObject(aBushMedium, 1, 2, 0, 2), new SimpleObject(aBushSmall, 2, 4, 0, 2)]
	],
	[
		scaleByMapSize(16, 262),
		scaleByMapSize(8, 131),
		planetm * scaleByMapSize(13, 200),
		planetm * scaleByMapSize(13, 200),
		planetm * scaleByMapSize(13, 200)
	],
	[avoidClasses(clForest, 0, clPlayer, 0, clHill, 0), stayClasses(clLand, 5)]
);

log("Creating straggler trees...");
createStragglerTrees(
	[oTree1, oTree2, oTree4, oTree3],
	[avoidClasses(clForest, 7, clHill, 1, clPlayer, 9), stayClasses(clLand, 7)]);

ExportMap();
