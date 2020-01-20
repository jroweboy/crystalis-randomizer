import { Entity } from './entity.js';
import { DataTuple, concatIterables, group, hex, initializer, readLittleEndian, seq, tuple, varSlice, writeLittleEndian, upperCamelToSpaces } from './util.js';
import { UnionFind } from '../unionfind.js';
import { assertNever, iters, DefaultMap } from '../util.js';
const CAVE = {
    subArea: 'cave',
    music: (area) => `${area.name}-Cave`,
    palette: (area) => `${area.name}-Cave`,
};
const HOUSE = {
    subArea: 'house',
    palette: () => Symbol(),
};
const FORTUNE_TELLER = {
    subArea: 'house',
    palette: () => Symbol(),
    music: (area) => `${area.name}-FortuneTeller`,
};
const MESIA = {
    name: 'mesia',
    music: (area) => `${area.name}-Mesia`,
    palette: (area) => area.name === 'Tower' ?
        area.name : `${area.name}-Mesia`,
};
const DYNA = {
    name: 'dyna',
    music: (area) => `${area.name}-Dyna`,
    palette: (area) => `${area.name}-Dyna`,
};
const KELBESQUE = {
    name: 'goa 1',
    music: 'goa 1',
    palette: 'goa 1',
};
const SABERA = {
    name: 'goa 2',
    music: 'goa 2',
    palette: 'goa 2',
};
const MADO_LOWER = {
    name: 'goa 3',
    music: 'goa 3',
    palette: 'goa 3',
};
const MADO_UPPER = { ...MADO_LOWER, palette: 'goa 3 upper' };
const KARMINE_UPPER = {
    name: 'goa 4',
    music: 'goa 4',
    palette: 'goa 4',
};
const KARMINE_LOWER = { ...KARMINE_UPPER, palette: 'goa 4 lower' };
const $ = (() => {
    const $ = initializer();
    let area;
    function $$(id, data = {}) {
        data = { ...data };
        area = data.area = data.area || area;
        return $(id, data);
    }
    ;
    $$.commit = (locations) => {
        const areas = locations.rom.areas;
        $.commit(locations, (prop, id, init) => {
            const name = upperCamelToSpaces(prop);
            const area = init.area(areas);
            const music = typeof init.music === 'function' ?
                init.music(area) : init.music != null ?
                init.music : area.name;
            const palette = typeof init.palette === 'function' ?
                init.palette(area) : init.palette || area.name;
            const data = { area, name, music, palette };
            if (init.subArea != null)
                data.subArea = init.subArea;
            if (init.bossScreen != null)
                data.bossScreen = init.bossScreen;
            const location = new Location(locations.rom, id, data);
            if (id >= 0)
                locations[id] = location;
            return location;
        });
    };
    return $$;
})();
export class Locations extends Array {
    constructor(rom) {
        super(0x100);
        this.rom = rom;
        this.MezameShrine = $(0x00, { area: a => a.Mezame });
        this.Leaf_OutsideStart = $(0x01, { music: 1 });
        this.Leaf = $(0x02, { area: a => a.Leaf });
        this.ValleyOfWind = $(0x03, { area: a => a.ValleyOfWind });
        this.SealedCave1 = $(0x04, { area: a => a.SealedCave });
        this.SealedCave2 = $(0x05);
        this.SealedCave6 = $(0x06);
        this.SealedCave4 = $(0x07);
        this.SealedCave5 = $(0x08);
        this.SealedCave3 = $(0x09);
        this.SealedCave7 = $(0x0a, { bossScreen: 0x91 });
        this.SealedCave8 = $(0x0c);
        this.WindmillCave = $(0x0e, { area: a => a.WindmillCave });
        this.Windmill = $(0x0f, { area: a => a.Windmill, music: 0 });
        this.ZebuCave = $(0x10, { area: a => a.ZebuCave });
        this.MtSabreWest_Cave1 = $(0x11, { area: a => a.MtSabreWest, ...CAVE });
        this.CordelPlainWest = $(0x14, { area: a => a.CordelPlain });
        this.CordelPlainEast = $(0x15);
        this.Brynmaer = $(0x18, { area: a => a.Brynmaer });
        this.OutsideStomHouse = $(0x19, { area: a => a.StomHouse,
            music: 0 });
        this.Swamp = $(0x1a, { area: a => a.Swamp,
            bossScreen: 0x7c });
        this.Amazones = $(0x1b, { area: a => a.Amazones });
        this.Oak = $(0x1c, { area: a => a.Oak });
        this.StomHouse = $(0x1e, { area: a => a.StomHouse });
        this.MtSabreWest_Lower = $(0x20, { area: a => a.MtSabreWest });
        this.MtSabreWest_Upper = $(0x21);
        this.MtSabreWest_Cave2 = $(0x22, CAVE);
        this.MtSabreWest_Cave3 = $(0x23, CAVE);
        this.MtSabreWest_Cave4 = $(0x24, CAVE);
        this.MtSabreWest_Cave5 = $(0x25, CAVE);
        this.MtSabreWest_Cave6 = $(0x26, CAVE);
        this.MtSabreWest_Cave7 = $(0x27, CAVE);
        this.MtSabreNorth_Main = $(0x28, { area: a => a.MtSabreNorth,
            bossScreen: 0xb5 });
        this.MtSabreNorth_Middle = $(0x29);
        this.MtSabreNorth_Cave2 = $(0x2a, CAVE);
        this.MtSabreNorth_Cave3 = $(0x2b, CAVE);
        this.MtSabreNorth_Cave4 = $(0x2c, CAVE);
        this.MtSabreNorth_Cave5 = $(0x2d, CAVE);
        this.MtSabreNorth_Cave6 = $(0x2e, CAVE);
        this.MtSabreNorth_PrisonHall = $(0x2f, CAVE);
        this.MtSabreNorth_LeftCell = $(0x30, CAVE);
        this.MtSabreNorth_LeftCell2 = $(0x31, CAVE);
        this.MtSabreNorth_RightCell = $(0x32, CAVE);
        this.MtSabreNorth_Cave8 = $(0x33, CAVE);
        this.MtSabreNorth_Cave9 = $(0x34, CAVE);
        this.MtSabreNorth_SummitCave = $(0x35, CAVE);
        this.MtSabreNorth_Cave1 = $(0x38, CAVE);
        this.MtSabreNorth_Cave7 = $(0x39, CAVE);
        this.Nadare_Inn = $(0x3c, { area: a => a.Nadare, ...HOUSE });
        this.Nadare_ToolShop = $(0x3d, HOUSE);
        this.Nadare_BackRoom = $(0x3e, HOUSE);
        this.WaterfallValleyNorth = $(0x40, { area: a => a.WaterfallValley });
        this.WaterfallValleySouth = $(0x41);
        this.LimeTreeValley = $(0x42, { area: a => a.LimeTreeValley,
            music: 0 });
        this.LimeTreeLake = $(0x43, { area: a => a.LimeTreeLake,
            music: 0 });
        this.KirisaPlantCave1 = $(0x44, { area: a => a.KirisaPlantCave });
        this.KirisaPlantCave2 = $(0x45);
        this.KirisaPlantCave3 = $(0x46);
        this.KirisaMeadow = $(0x47, { area: a => a.KirisaMeadow });
        this.FogLampCave1 = $(0x48, { area: a => a.FogLampCave });
        this.FogLampCave2 = $(0x49);
        this.FogLampCave3 = $(0x4a);
        this.FogLampCaveDeadEnd = $(0x4b);
        this.FogLampCave4 = $(0x4c);
        this.FogLampCave5 = $(0x4d);
        this.FogLampCave6 = $(0x4e);
        this.FogLampCave7 = $(0x4f);
        this.Portoa = $(0x50, { area: a => a.Portoa });
        this.Portoa_FishermanIsland = $(0x51, { area: a => a.FishermanHouse,
            music: 0 });
        this.MesiaShrine = $(0x52, { area: a => a.LimeTreeLake,
            ...MESIA });
        this.WaterfallCave1 = $(0x54, { area: a => a.WaterfallCave });
        this.WaterfallCave2 = $(0x55);
        this.WaterfallCave3 = $(0x56);
        this.WaterfallCave4 = $(0x57);
        this.TowerEntrance = $(0x58, { area: a => a.Tower });
        this.Tower1 = $(0x59);
        this.Tower2 = $(0x5a);
        this.Tower3 = $(0x5b);
        this.TowerOutsideMesia = $(0x5c);
        this.TowerOutsideDyna = $(0x5d);
        this.TowerMesia = $(0x5e, MESIA);
        this.TowerDyna = $(0x5f, DYNA);
        this.AngrySea = $(0x60, { area: a => a.AngrySea });
        this.BoatHouse = $(0x61);
        this.JoelLighthouse = $(0x62, { area: a => a.Lighthouse,
            music: 0 });
        this.UndergroundChannel = $(0x64, { area: a => a.UndergroundChannel });
        this.ZombieTown = $(0x65, { area: a => a.ZombieTown });
        this.EvilSpiritIsland1 = $(0x68, { area: a => a.EvilSpiritIslandEntrance,
            music: 1 });
        this.EvilSpiritIsland2 = $(0x69, { area: a => a.EvilSpiritIsland });
        this.EvilSpiritIsland3 = $(0x6a);
        this.EvilSpiritIsland4 = $(0x6b);
        this.SaberaPalace1 = $(0x6c, { area: a => a.SaberaFortress,
            bossScreen: 0xfd });
        this.SaberaPalace2 = $(0x6d);
        this.SaberaPalace3 = $(0x6e, { bossScreen: 0xfd });
        this.JoelSecretPassage = $(0x70, { area: a => a.JoelPassage });
        this.Joel = $(0x71, { area: a => a.Joel });
        this.Swan = $(0x72, { area: a => a.Swan, music: 1 });
        this.SwanGate = $(0x73, { area: a => a.SwanGate,
            music: 1 });
        this.GoaValley = $(0x78, { area: a => a.GoaValley });
        this.MtHydra = $(0x7c, { area: a => a.MtHydra });
        this.MtHydra_Cave1 = $(0x7d, CAVE);
        this.MtHydra_OutsideShyron = $(0x7e);
        this.MtHydra_Cave2 = $(0x7f, CAVE);
        this.MtHydra_Cave3 = $(0x80, CAVE);
        this.MtHydra_Cave4 = $(0x81, CAVE);
        this.MtHydra_Cave5 = $(0x82, CAVE);
        this.MtHydra_Cave6 = $(0x83, CAVE);
        this.MtHydra_Cave7 = $(0x84, CAVE);
        this.MtHydra_Cave8 = $(0x85, CAVE);
        this.MtHydra_Cave9 = $(0x86, CAVE);
        this.MtHydra_Cave10 = $(0x87, CAVE);
        this.Styx1 = $(0x88, { area: a => a.Styx });
        this.Styx2 = $(0x89);
        this.Styx3 = $(0x8a);
        this.Shyron = $(0x8c, { area: a => a.Shyron });
        this.Goa = $(0x8e, { area: a => a.Goa });
        this.GoaFortressBasement = $(0x8f, { area: a => a.FortressBasement,
            music: 0 });
        this.Desert1 = $(0x90, { area: a => a.Desert1 });
        this.OasisCaveMain = $(0x91, { area: a => a.OasisCave });
        this.DesertCave1 = $(0x92, { area: a => a.DesertCave1,
            music: 0 });
        this.Sahara = $(0x93, { area: a => a.Sahara });
        this.SaharaOutsideCave = $(0x94, { music: 0 });
        this.DesertCave2 = $(0x95, { area: a => a.DesertCave2, music: 1 });
        this.SaharaMeadow = $(0x96, { area: a => a.SaharaMeadow, music: 0 });
        this.Desert2 = $(0x98, { area: a => a.Desert2 });
        this.Pyramid_Entrance = $(0x9c, { area: a => a.Pyramid });
        this.Pyramid_Branch = $(0x9d);
        this.Pyramid_Main = $(0x9e);
        this.Pyramid_Draygon = $(0x9f);
        this.Crypt_Entrance = $(0xa0, { area: a => a.Crypt });
        this.Crypt_Hall1 = $(0xa1);
        this.Crypt_Branch = $(0xa2);
        this.Crypt_DeadEndLeft = $(0xa3);
        this.Crypt_DeadEndRight = $(0xa4);
        this.Crypt_Hall2 = $(0xa5);
        this.Crypt_Draygon2 = $(0xa6);
        this.Crypt_Teleporter = $(0xa7, { music: 'Crypt-Teleporter' });
        this.GoaFortress_Entrance = $(0xa8, { area: a => a.GoaFortress,
            music: KELBESQUE.music });
        this.GoaFortress_Kelbesque = $(0xa9, { bossScreen: 0x73,
            ...KELBESQUE });
        this.GoaFortress_Zebu = $(0xaa, { ...KELBESQUE,
            palette: SABERA.palette });
        this.GoaFortress_Sabera = $(0xab, SABERA);
        this.GoaFortress_Tornel = $(0xac, { bossScreen: 0x91,
            ...SABERA,
            palette: MADO_LOWER.palette });
        this.GoaFortress_Mado1 = $(0xad, MADO_LOWER);
        this.GoaFortress_Mado2 = $(0xae, MADO_UPPER);
        this.GoaFortress_Mado3 = $(0xaf, MADO_UPPER);
        this.GoaFortress_Karmine1 = $(0xb0, KARMINE_UPPER);
        this.GoaFortress_Karmine2 = $(0xb1, KARMINE_UPPER);
        this.GoaFortress_Karmine3 = $(0xb2, KARMINE_UPPER);
        this.GoaFortress_Karmine4 = $(0xb3, KARMINE_UPPER);
        this.GoaFortress_Karmine5 = $(0xb4, KARMINE_UPPER);
        this.GoaFortress_Karmine6 = $(0xb5, KARMINE_LOWER);
        this.GoaFortress_Karmine7 = $(0xb6, { bossScreen: 0xfd,
            ...KARMINE_LOWER });
        this.GoaFortress_Exit = $(0xb7, { music: KARMINE_UPPER.music });
        this.OasisCave_Entrance = $(0xb8, { area: a => a.OasisEntrance,
            music: 2 });
        this.GoaFortress_Asina = $(0xb9, { area: a => a.GoaFortress,
            ...MADO_UPPER,
            bossScreen: 0x91 });
        this.GoaFortress_Kensu = $(0xba, KARMINE_UPPER);
        this.Goa_House = $(0xbb, { area: a => a.Goa, ...HOUSE });
        this.Goa_Inn = $(0xbc, HOUSE);
        this.Goa_ToolShop = $(0xbe, HOUSE);
        this.Goa_Tavern = $(0xbf, HOUSE);
        this.Leaf_ElderHouse = $(0xc0, { area: a => a.Leaf, ...HOUSE });
        this.Leaf_RabbitHut = $(0xc1, HOUSE);
        this.Leaf_Inn = $(0xc2, HOUSE);
        this.Leaf_ToolShop = $(0xc3, HOUSE);
        this.Leaf_ArmorShop = $(0xc4, HOUSE);
        this.Leaf_StudentHouse = $(0xc5, HOUSE);
        this.Brynmaer_Tavern = $(0xc6, { area: a => a.Brynmaer, ...HOUSE });
        this.Brynmaer_PawnShop = $(0xc7, HOUSE);
        this.Brynmaer_Inn = $(0xc8, HOUSE);
        this.Brynmaer_ArmorShop = $(0xc9, HOUSE);
        this.Brynmaer_ItemShop = $(0xcb, HOUSE);
        this.Oak_ElderHouse = $(0xcd, { area: a => a.Oak, ...HOUSE });
        this.Oak_MotherHouse = $(0xce, HOUSE);
        this.Oak_ToolShop = $(0xcf, HOUSE);
        this.Oak_Inn = $(0xd0, HOUSE);
        this.Amazones_Inn = $(0xd1, { area: a => a.Amazones, ...HOUSE });
        this.Amazones_ItemShop = $(0xd2, HOUSE);
        this.Amazones_ArmorShop = $(0xd3, HOUSE);
        this.Amazones_Elder = $(0xd4, HOUSE);
        this.Nadare = $(0xd5, { area: a => a.Nadare });
        this.Portoa_FishermanHouse = $(0xd6, { area: a => a.FishermanHouse,
            ...HOUSE, music: 0 });
        this.Portoa_PalaceEntrance = $(0xd7, { area: a => a.PortoaPalace });
        this.Portoa_FortuneTeller = $(0xd8, { area: a => a.Portoa,
            ...FORTUNE_TELLER });
        this.Portoa_PawnShop = $(0xd9, HOUSE);
        this.Portoa_ArmorShop = $(0xda, HOUSE);
        this.Portoa_Inn = $(0xdc, HOUSE);
        this.Portoa_ToolShop = $(0xdd, HOUSE);
        this.PortoaPalace_Left = $(0xde, { area: a => a.PortoaPalace,
            ...HOUSE });
        this.PortoaPalace_ThroneRoom = $(0xdf, HOUSE);
        this.PortoaPalace_Right = $(0xe0, HOUSE);
        this.Portoa_AsinaRoom = $(0xe1, { area: a => a.UndergroundChannel,
            ...HOUSE, music: 'asina' });
        this.Amazones_ElderDownstairs = $(0xe2, { area: a => a.Amazones,
            ...HOUSE });
        this.Joel_ElderHouse = $(0xe3, { area: a => a.Joel, ...HOUSE });
        this.Joel_Shed = $(0xe4, HOUSE);
        this.Joel_ToolShop = $(0xe5, HOUSE);
        this.Joel_Inn = $(0xe7, HOUSE);
        this.ZombieTown_House = $(0xe8, { area: a => a.ZombieTown,
            ...HOUSE });
        this.ZombieTown_HouseBasement = $(0xe9, HOUSE);
        this.Swan_ToolShop = $(0xeb, { area: a => a.Swan, ...HOUSE });
        this.Swan_StomHut = $(0xec, HOUSE);
        this.Swan_Inn = $(0xed, HOUSE);
        this.Swan_ArmorShop = $(0xee, HOUSE);
        this.Swan_Tavern = $(0xef, HOUSE);
        this.Swan_PawnShop = $(0xf0, HOUSE);
        this.Swan_DanceHall = $(0xf1, HOUSE);
        this.Shyron_Temple = $(0xf2, { area: a => a.ShyronTemple,
            bossScreen: 0x70 });
        this.Shyron_TrainingHall = $(0xf3, { area: a => a.Shyron, ...HOUSE });
        this.Shyron_Hospital = $(0xf4, HOUSE);
        this.Shyron_ArmorShop = $(0xf5, HOUSE);
        this.Shyron_ToolShop = $(0xf6, HOUSE);
        this.Shyron_Inn = $(0xf7, HOUSE);
        this.Sahara_Inn = $(0xf8, { area: a => a.Sahara, ...HOUSE });
        this.Sahara_ToolShop = $(0xf9, HOUSE);
        this.Sahara_ElderHouse = $(0xfa, HOUSE);
        this.Sahara_PawnShop = $(0xfb, HOUSE);
        this.EastCave1 = $(-1, { area: a => a.EastCave });
        this.EastCave2 = $(-1);
        this.FishermanBeach = $(-1, { area: a => a.FishermanHouse, ...HOUSE });
        $.commit(this);
        for (let id = 0; id < 0x100; id++) {
            if (this[id])
                continue;
            this[id] = new Location(rom, id, {
                area: rom.areas.Empty,
                name: '',
                music: '',
                palette: '',
            });
        }
    }
    allocate(location) {
        for (const l of this) {
            if (l.used)
                continue;
            location.id = l.id;
            location.used = true;
            return this[l.id] = location;
        }
        throw new Error('No unused location');
    }
}
export class Location extends Entity {
    constructor(rom, id, data) {
        super(rom, id);
        this.data = data;
        const mapDataBase = id >= 0 ? readLittleEndian(rom.prg, this.mapDataPointer) + 0xc000 : 0;
        this.used = mapDataBase > 0xc000 && !!this.name;
        if (!this.used) {
            this.bgm = 0;
            this.layoutWidth = 0;
            this.layoutHeight = 0;
            this.animation = 0;
            this.extended = 0;
            this.screens = [[0]];
            this.tilePalettes = [0x24, 0x01, 0x26];
            this.tileset = 0x80;
            this.tileEffects = 0xb3;
            this.tilePatterns = [2, 4];
            this.exits = [];
            this.entrances = [];
            this.flags = [];
            this.pits = [];
            this.spawns = [];
            this.spritePalettes = [0, 0];
            this.spritePatterns = [0, 0];
            return;
        }
        const layoutBase = readLittleEndian(rom.prg, mapDataBase) + 0xc000;
        const graphicsBase = readLittleEndian(rom.prg, mapDataBase + 2) + 0xc000;
        const entrancesBase = readLittleEndian(rom.prg, mapDataBase + 4) + 0xc000;
        const exitsBase = readLittleEndian(rom.prg, mapDataBase + 6) + 0xc000;
        const flagsBase = readLittleEndian(rom.prg, mapDataBase + 8) + 0xc000;
        let hasPits = this.used && layoutBase !== mapDataBase + 10;
        let entranceLen = exitsBase - entrancesBase;
        this.exits = (() => {
            const exits = [];
            let i = exitsBase;
            while (!(rom.prg[i] & 0x80)) {
                if (rom.prg[i + 2] != 0xff) {
                    exits.push(Exit.from(rom.prg, i));
                }
                i += 4;
            }
            if (rom.prg[i] !== 0xff) {
                hasPits = !!(rom.prg[i] & 0x40);
                entranceLen = (rom.prg[i] & 0x1f) << 2;
            }
            return exits;
        })();
        const pitsBase = !hasPits ? 0 : readLittleEndian(rom.prg, mapDataBase + 10) + 0xc000;
        this.bgm = rom.prg[layoutBase];
        this.layoutWidth = rom.prg[layoutBase + 1];
        this.layoutHeight = rom.prg[layoutBase + 2];
        this.animation = rom.prg[layoutBase + 3];
        this.extended = rom.prg[layoutBase + 4];
        this.screens = seq(this.height, y => tuple(rom.prg, layoutBase + 5 + y * this.width, this.width));
        this.tilePalettes = tuple(rom.prg, graphicsBase, 3);
        this.tileset = rom.prg[graphicsBase + 3];
        this.tileEffects = rom.prg[graphicsBase + 4];
        this.tilePatterns = tuple(rom.prg, graphicsBase + 5, 2);
        this.entrances =
            group(4, rom.prg.slice(entrancesBase, entrancesBase + entranceLen), x => Entrance.from(x));
        this.flags = varSlice(rom.prg, flagsBase, 2, 0xff, Infinity, x => Flag.from(x));
        this.pits = pitsBase ? varSlice(rom.prg, pitsBase, 4, 0xff, Infinity, x => Pit.from(x)) : [];
        const npcDataBase = readLittleEndian(rom.prg, this.npcDataPointer) + 0x10000;
        const hasSpawns = npcDataBase !== 0x10000;
        this.spritePalettes =
            hasSpawns ? tuple(rom.prg, npcDataBase + 1, 2) : [0, 0];
        this.spritePatterns =
            hasSpawns ? tuple(rom.prg, npcDataBase + 3, 2) : [0, 0];
        this.spawns =
            hasSpawns ? varSlice(rom.prg, npcDataBase + 5, 4, 0xff, Infinity, x => Spawn.from(x)) : [];
    }
    get name() {
        return this.data.name;
    }
    get mapDataPointer() {
        if (this.id < 0)
            throw new Error(`no mapdata pointer for ${this.name}`);
        return 0x14300 + (this.id << 1);
    }
    get npcDataPointer() {
        if (this.id < 0)
            throw new Error(`no npcdata pointer for ${this.name}`);
        return 0x19201 + (this.id << 1);
    }
    get hasSpawns() {
        return this.spawns.length > 0;
    }
    get screenPage() {
        if (!this.rom.compressedMapData)
            return this.extended ? 0x100 : 0;
        return this.extended << 8;
    }
    isShop() {
        return this.rom.shops.findIndex(s => s.location === this.id) >= 0;
    }
    spawn(id) {
        const spawn = this.spawns[id - 0xd];
        if (!spawn)
            throw new Error(`Expected spawn $${hex(id)}`);
        return spawn;
    }
    get width() { return this.layoutWidth + 1; }
    set width(width) { this.layoutWidth = width - 1; }
    get height() { return this.layoutHeight + 1; }
    set height(height) { this.layoutHeight = height - 1; }
    async write(writer) {
        if (!this.used)
            return;
        const promises = [];
        if (!this.spawns.length) {
            this.spritePalettes = [0xff, 0xff];
            this.spritePatterns = [0xff, 0xff];
        }
        const data = [0, ...this.spritePalettes, ...this.spritePatterns,
            ...concatIterables(this.spawns), 0xff];
        promises.push(writer.write(data, 0x18000, 0x1bfff, `NpcData ${hex(this.id)}`)
            .then(address => writeLittleEndian(writer.rom, this.npcDataPointer, address - 0x10000)));
        const write = (data, name) => writer.write(data, 0x14000, 0x17fff, `${name} ${hex(this.id)}`);
        const layout = this.rom.compressedMapData ? [
            this.bgm,
            this.layoutHeight << 4 | this.layoutWidth,
            this.extended << 2 | this.animation,
            ...concatIterables(this.screens),
        ] : [
            this.bgm,
            this.layoutWidth, this.layoutHeight, this.animation, this.extended,
            ...concatIterables(this.screens),
        ];
        const graphics = [...this.tilePalettes,
            this.tileset, this.tileEffects,
            ...this.tilePatterns];
        if (this.height === 1) {
            for (const entrance of this.entrances) {
                if (!entrance.used)
                    continue;
                if (entrance.y > 0xbf)
                    entrance.y = 0xbf;
            }
            for (const exit of this.exits) {
                if (exit.yt > 0x0c)
                    exit.yt = 0x0c;
            }
        }
        const entrances = concatIterables(this.entrances);
        const exits = [...concatIterables(this.exits),
            0x80 | (this.pits.length ? 0x40 : 0) | this.entrances.length,
        ];
        const flags = [...concatIterables(this.flags), 0xff];
        const pits = concatIterables(this.pits);
        const [layoutAddr, graphicsAddr, entrancesAddr, exitsAddr, flagsAddr, pitsAddr] = await Promise.all([
            write(layout, 'Layout'),
            write(graphics, 'Graphics'),
            write(entrances, 'Entrances'),
            write(exits, 'Exits'),
            write(flags, 'Flags'),
            ...(pits.length ? [write(pits, 'Pits')] : []),
        ]);
        const addresses = [
            layoutAddr & 0xff, (layoutAddr >>> 8) - 0xc0,
            graphicsAddr & 0xff, (graphicsAddr >>> 8) - 0xc0,
            entrancesAddr & 0xff, (entrancesAddr >>> 8) - 0xc0,
            exitsAddr & 0xff, (exitsAddr >>> 8) - 0xc0,
            flagsAddr & 0xff, (flagsAddr >>> 8) - 0xc0,
            ...(pitsAddr ? [pitsAddr & 0xff, (pitsAddr >> 8) - 0xc0] : []),
        ];
        const base = await write(addresses, 'MapData');
        writeLittleEndian(writer.rom, this.mapDataPointer, base - 0xc000);
        await Promise.all(promises);
        const bossId = this.bossId();
        if (bossId != null && this.id !== 0x5f) {
            let pats = [this.spritePatterns[0], undefined];
            if (this.id === 0xa6)
                pats = [0x53, 0x50];
            const bossBase = readLittleEndian(writer.rom, 0x1f96b + 2 * bossId) + 0x14000;
            const restoreBgm = this.id === 0xa6 ? 0 : this.bgm;
            const bossRestore = [
                ,
                , , restoreBgm, ,
                ...this.tilePalettes, , , , this.spritePalettes[0], ,
                ,
                , , , , ,
                this.animation,
            ];
            const [] = [pats];
            for (let j = 0; j < bossRestore.length; j++) {
                const restored = bossRestore[j];
                if (restored == null)
                    continue;
                writer.rom[bossBase + j] = restored;
            }
            const bossBase2 = 0x1f7c1 + 5 * bossId;
            writer.rom[bossBase2] = this.spritePalettes[1];
        }
    }
    allScreens() {
        const screens = new Set();
        const ext = this.screenPage;
        for (const row of this.screens) {
            for (const screen of row) {
                screens.add(this.rom.screens[screen + ext]);
            }
        }
        return screens;
    }
    bossId() {
        for (let i = 0; i < 0x0e; i++) {
            if (this.rom.prg[0x1f95d + i] === this.id)
                return i;
        }
        return undefined;
    }
    hasDolphin() {
        return this.id === 0x60 || this.id === 0x64 || this.id === 0x68;
    }
    reachableTiles(fly = false) {
        if (this.hasDolphin())
            fly = true;
        const exits = new Set(this.exits.map(exit => exit.screen << 8 | exit.tile));
        const uf = new UnionFind();
        const tileset = this.rom.tileset(this.tileset);
        const tileEffects = this.rom.tileEffects[this.tileEffects - 0xb3];
        const passable = new Set();
        for (let y = 0; y < this.height; y++) {
            const row = this.screens[y];
            for (let x = 0; x < this.width; x++) {
                const screen = this.rom.screens[row[x] | this.screenPage];
                const pos = y << 4 | x;
                const flag = this.flags.find(f => f.screen === pos);
                for (let t = 0; t < 0xf0; t++) {
                    const tileId = pos << 8 | t;
                    if (exits.has(tileId))
                        continue;
                    let tile = screen.tiles[t];
                    let effects = tileEffects.effects[tile];
                    let blocked = fly ? effects & 0x04 : effects & 0x06;
                    if (flag && blocked && tile < 0x20 && tileset.alternates[tile] != tile) {
                        tile = tileset.alternates[tile];
                        effects = tileEffects.effects[tile];
                        blocked = fly ? effects & 0x04 : effects & 0x06;
                    }
                    if (!blocked)
                        passable.add(tileId);
                }
            }
        }
        for (let t of passable) {
            const right = (t & 0x0f) === 0x0f ? t + 0xf1 : t + 1;
            if (passable.has(right))
                uf.union([t, right]);
            const below = (t & 0xf0) === 0xe0 ? t + 0xf20 : t + 16;
            if (passable.has(below))
                uf.union([t, below]);
        }
        const map = uf.map();
        const sets = new Set();
        for (const entrance of this.entrances) {
            if (!entrance.used)
                continue;
            const id = entrance.screen << 8 | entrance.tile;
            sets.add(map.get(id) || new Set());
        }
        const out = new Map();
        for (const set of sets) {
            for (const t of set) {
                const scr = this.screens[t >>> 12][(t >>> 8) & 0x0f];
                const screen = this.rom.screens[scr | this.screenPage];
                out.set(t, tileEffects.effects[screen.tiles[t & 0xff]]);
            }
        }
        return out;
    }
    screenMover() {
        const map = new DefaultMap(() => []);
        const objs = iters.concat(this.spawns, this.exits, this.entrances);
        for (const obj of objs) {
            map.get(obj.screen).push(obj);
        }
        return (orig, repl) => {
            for (const obj of map.get(orig)) {
                obj.screen = repl;
            }
        };
    }
    moveScreen(orig, repl) {
        const objs = iters.concat(this.spawns, this.exits, this.entrances);
        for (const obj of objs) {
            if (obj.screen === orig)
                obj.screen = repl;
        }
    }
    monsterPlacer(random) {
        const boss = this.data.bossScreen;
        const reachable = this.reachableTiles(false);
        const extended = new Map([...reachable.keys()].map(x => [x, 0]));
        const normal = [];
        const moths = [];
        const birds = [];
        const plants = [];
        const placed = [];
        const normalTerrainMask = this.hasDolphin() ? 0x25 : 0x27;
        for (const [t, distance] of extended) {
            const scr = this.screens[t >>> 12][(t >>> 8) & 0xf];
            if (scr === boss)
                continue;
            for (const n of neighbors(t, this.width, this.height)) {
                if (extended.has(n))
                    continue;
                extended.set(n, distance + 1);
            }
            if (!distance && !(reachable.get(t) & normalTerrainMask))
                normal.push(t);
            if (this.id === 0x1a) {
                if (this.rom.screens[scr].tiles[t & 0xff] === 0xf0)
                    plants.push(t);
            }
            else {
                if (distance >= 2 && distance <= 4)
                    plants.push(t);
            }
            if (distance >= 3 && distance <= 7)
                moths.push(t);
            if (distance >= 12)
                birds.push(t);
        }
        return (m) => {
            const placement = m.placement();
            const pool = [...(placement === 'normal' ? normal :
                    placement === 'moth' ? moths :
                        placement === 'bird' ? birds :
                            placement === 'plant' ? plants :
                                assertNever(placement))];
            POOL: while (pool.length) {
                const i = random.nextInt(pool.length);
                const [pos] = pool.splice(i, 1);
                const x = (pos & 0xf00) >>> 4 | (pos & 0xf);
                const y = (pos & 0xf000) >>> 8 | (pos & 0xf0) >>> 4;
                const r = m.clearance();
                for (const [, x1, y1, r1] of placed) {
                    const z2 = ((y - y1) ** 2 + (x - x1) ** 2);
                    if (z2 < (r + r1) ** 2)
                        continue POOL;
                }
                for (const { x: x1, y: y1, used } of this.entrances) {
                    if (!used)
                        continue;
                    const z2 = ((y - (y1 >> 4)) ** 2 + (x - (x1 >> 4)) ** 2);
                    if (z2 < (r + 1) ** 2)
                        continue POOL;
                }
                placed.push([m, x, y, r]);
                const scr = (y & 0xf0) | (x & 0xf0) >>> 4;
                const tile = (y & 0x0f) << 4 | (x & 0x0f);
                return scr << 8 | tile;
            }
            return undefined;
        };
    }
    resizeScreens(top, left, bottom, right) {
        const newWidth = this.width + left + right;
        const newHeight = this.height + top + bottom;
        const newScreens = Array.from({ length: newHeight }, (_, y) => {
            y -= top;
            return Array.from({ length: newWidth }, (_, x) => {
                x -= left;
                if (y < 0 || x < 0 || y >= this.height || x >= this.width)
                    return 0;
                return this.screens[y][x];
            });
        });
        this.width = newWidth;
        this.height = newHeight;
        this.screens = newScreens;
        for (const f of this.flags) {
            f.xs += left;
            f.ys += top;
        }
        for (const p of this.pits) {
            p.fromXs += left;
            p.fromYs += top;
        }
        for (const s of [...this.spawns, ...this.exits]) {
            s.xt += 16 * left;
            s.yt += 16 * top;
        }
        for (const e of this.entrances) {
            if (!e.used)
                continue;
            e.x += 256 * left;
            e.y += 256 * top;
        }
    }
    writeScreens2d(start, data) {
        const x0 = start & 0xf;
        const y0 = start >>> 4;
        for (let y = 0; y < data.length; y++) {
            const row = data[y];
            for (let x = 0; x < row.length; x++) {
                const tile = row[x];
                if (tile != null)
                    this.screens[y0 + y][x0 + x] = tile;
            }
        }
    }
    connect(pos, that, thatPos) {
        const thisY = pos >>> 4;
        const thisX = pos & 0xf;
        const thatY = thatPos >>> 4;
        const thatX = thatPos & 0xf;
        const thisTile = this.screens[thisY][thisX];
        const thatTile = that.screens[thatY][thatX];
        const [thisEntrance, thisExits] = screenExits[thisTile];
        const [thatEntrance, thatExits] = screenExits[thatTile];
        const thisEntranceIndex = this.entrances.length;
        const thatEntranceIndex = that.entrances.length;
        this.entrances.push(Entrance.of({ y: thisY << 8 | thisEntrance >>> 8,
            x: thisX << 8 | thisEntrance & 0xff }));
        that.entrances.push(Entrance.of({ y: thatY << 8 | thatEntrance >>> 8,
            x: thatX << 8 | thatEntrance & 0xff }));
        for (const exit of thisExits) {
            this.exits.push(Exit.of({ screen: pos, tile: exit,
                dest: that.id, entrance: thatEntranceIndex }));
        }
        for (const exit of thatExits) {
            that.exits.push(Exit.of({ screen: thatPos, tile: exit,
                dest: this.id, entrance: thisEntranceIndex }));
        }
    }
    neighborForEntrance(entranceId) {
        const entrance = this.entrances[entranceId];
        if (!entrance)
            throw new Error(`no entrance ${hex(this.id)}:${entranceId}`);
        for (const exit of this.exits) {
            if (exit.screen !== entrance.screen)
                continue;
            const dx = Math.abs(exit.x - entrance.x);
            const dy = Math.abs(exit.y - entrance.y);
            if (dx < 24 && dy < 24)
                return this.rom.locations[exit.dest];
        }
        throw new Error(`no exit found near ${hex(this.id)}:${entranceId}`);
    }
}
function neighbors(tile, width, height) {
    const out = [];
    const y = tile & 0xf0f0;
    const x = tile & 0x0f0f;
    if (y < ((height - 1) << 12 | 0xe0)) {
        out.push((tile & 0xf0) === 0xe0 ? tile + 0x0f20 : tile + 16);
    }
    if (y) {
        out.push((tile & 0xf0) === 0x00 ? tile - 0x0f20 : tile - 16);
    }
    if (x < ((width - 1) << 8 | 0x0f)) {
        out.push((tile & 0x0f) === 0x0f ? tile + 0x00f1 : tile + 1);
    }
    if (x) {
        out.push((tile & 0x0f) === 0x00 ? tile - 0x00f1 : tile - 1);
    }
    return out;
}
export const Entrance = DataTuple.make(4, {
    x: DataTuple.prop([0], [1, 0xff, -8]),
    y: DataTuple.prop([2], [3, 0xff, -8]),
    screen: DataTuple.prop([3, 0x0f, -4], [1, 0x0f]),
    tile: DataTuple.prop([2, 0xf0], [0, 0xf0, 4]),
    coord: DataTuple.prop([2, 0xff, -8], [0, 0xff]),
    used: {
        get() { return this.data[1] != 0xff; },
    },
    toString() {
        return `Entrance ${this.hex()}: (${hex(this.x)}, ${hex(this.y)})`;
    },
});
export const Exit = DataTuple.make(4, {
    x: DataTuple.prop([0, 0xff, -4]),
    xt: DataTuple.prop([0]),
    y: DataTuple.prop([1, 0xff, -4]),
    yt: DataTuple.prop([1]),
    screen: DataTuple.prop([1, 0xf0], [0, 0xf0, 4]),
    tile: DataTuple.prop([1, 0x0f, -4], [0, 0x0f]),
    dest: DataTuple.prop([2]),
    entrance: DataTuple.prop([3]),
    toString() {
        return `Exit ${this.hex()}: (${hex(this.x)}, ${hex(this.y)}) => ${this.dest}:${this.entrance}`;
    },
});
export const Flag = DataTuple.make(2, {
    flag: {
        get() { return this.data[0] | 0x200; },
        set(f) {
            if ((f & ~0xff) !== 0x200)
                throw new Error(`bad flag: ${hex(f)}`);
            this.data[0] = f & 0xff;
        },
    },
    x: DataTuple.prop([1, 0x07, -8]),
    xs: DataTuple.prop([1, 0x07]),
    y: DataTuple.prop([1, 0xf0, -4]),
    ys: DataTuple.prop([1, 0xf0, 4]),
    yx: DataTuple.prop([1]),
    screen: DataTuple.prop([1]),
    toString() {
        return `Flag ${this.hex()}: (${hex(this.xs)}, ${hex(this.ys)}) @ ${hex(this.flag)}`;
    },
});
export const Pit = DataTuple.make(4, {
    fromXs: DataTuple.prop([1, 0x70, 4]),
    toXs: DataTuple.prop([1, 0x07]),
    fromYs: DataTuple.prop([3, 0xf0, 4]),
    toYs: DataTuple.prop([3, 0x0f]),
    dest: DataTuple.prop([0]),
    toString() {
        return `Pit ${this.hex()}: (${hex(this.fromXs)}, ${hex(this.fromYs)}) => ${hex(this.dest)}:(${hex(this.toXs)}, ${hex(this.toYs)})`;
    },
});
export const Spawn = DataTuple.make(4, {
    y: DataTuple.prop([0, 0xff, -4]),
    yt: DataTuple.prop([0]),
    timed: DataTuple.booleanProp([1, 0x80, 7]),
    x: DataTuple.prop([1, 0x7f, -4], [2, 0x40, 3]),
    xt: DataTuple.prop([1, 0x7f]),
    screen: DataTuple.prop([0, 0xf0], [1, 0x70, 4]),
    tile: DataTuple.prop([0, 0x0f, -4], [1, 0x0f]),
    patternBank: DataTuple.prop([2, 0x80, 7]),
    type: DataTuple.prop([2, 0x07]),
    id: DataTuple.prop([3]),
    used: { get() { return this.data[0] !== 0xfe; },
        set(used) { this.data[0] = used ? 0 : 0xfe; } },
    monsterId: { get() { return (this.id + 0x50) & 0xff; },
        set(id) { this.id = (id - 0x50) & 0xff; } },
    isChest() { return this.type === 2 && this.id < 0x80; },
    isInvisible() {
        return this.isChest() && Boolean(this.data[2] & 0x20);
    },
    isTrigger() { return this.type === 2 && this.id >= 0x80; },
    isNpc() { return this.type === 1 && this.id < 0xc0; },
    isBoss() { return this.type === 1 && this.id >= 0xc0; },
    isMonster() { return this.type === 0; },
    isWall() {
        return Boolean(this.type === 3 && (this.id < 4 || (this.data[2] & 0x20)));
    },
    isShootingWall(location) {
        return this.isWall() &&
            !!(this.data[2] & 0x20 ? this.data[2] & 0x10 :
                location.id === 0x8f || location.id === 0xa8);
    },
    wallType() {
        if (this.type !== 3)
            return '';
        const obj = this.data[2] & 0x20 ? this.id >>> 4 : this.id;
        if (obj >= 4)
            return '';
        return obj === 2 ? 'bridge' : 'wall';
    },
    wallElement() {
        if (!this.isWall())
            return -1;
        return this.id & 3;
    },
    toString() {
        return `Spawn ${this.hex()}: (${hex(this.x)}, ${hex(this.y)}) ${this.timed ? 'timed' : 'fixed'} ${this.type}:${hex(this.id)}`;
    },
});
export const LOCATIONS = {
    mezameShrine: [0x00, 'Mezame Shrine'],
    leafOutsideStart: [0x01, 'Leaf - Outside Start'],
    leaf: [0x02, 'Leaf'],
    valleyOfWind: [0x03, 'Valley of Wind'],
    sealedCave1: [0x04, 'Sealed Cave 1'],
    sealedCave2: [0x05, 'Sealed Cave 2'],
    sealedCave6: [0x06, 'Sealed Cave 6'],
    sealedCave4: [0x07, 'Sealed Cave 4'],
    sealedCave5: [0x08, 'Sealed Cave 5'],
    sealedCave3: [0x09, 'Sealed Cave 3'],
    sealedCave7: [0x0a, 'Sealed Cave 7'],
    sealedCave8: [0x0c, 'Sealed Cave 8'],
    windmillCave: [0x0e, 'Windmill Cave'],
    windmill: [0x0f, 'Windmill'],
    zebuCave: [0x10, 'Zebu Cave'],
    mtSabreWestCave1: [0x11, 'Mt Sabre West - Cave 1'],
    cordelPlainsWest: [0x14, 'Cordel Plains West'],
    cordelPlainsEast: [0x15, 'Cordel Plains East'],
    brynmaer: [0x18, 'Brynmaer'],
    outsideStomHouse: [0x19, 'Outside Stom House'],
    swamp: [0x1a, 'Swamp'],
    amazones: [0x1b, 'Amazones'],
    oak: [0x1c, 'Oak'],
    stomHouse: [0x1e, 'Stom House'],
    mtSabreWestLower: [0x20, 'Mt Sabre West - Lower'],
    mtSabreWestUpper: [0x21, 'Mt Sabre West - Upper'],
    mtSabreWestCave2: [0x22, 'Mt Sabre West - Cave 2'],
    mtSabreWestCave3: [0x23, 'Mt Sabre West - Cave 3'],
    mtSabreWestCave4: [0x24, 'Mt Sabre West - Cave 4'],
    mtSabreWestCave5: [0x25, 'Mt Sabre West - Cave 5'],
    mtSabreWestCave6: [0x26, 'Mt Sabre West - Cave 6'],
    mtSabreWestCave7: [0x27, 'Mt Sabre West - Cave 7'],
    mtSabreNorthMain: [0x28, 'Mt Sabre North - Main'],
    mtSabreNorthMiddle: [0x29, 'Mt Sabre North - Middle'],
    mtSabreNorthCave2: [0x2a, 'Mt Sabre North - Cave 2'],
    mtSabreNorthCave3: [0x2b, 'Mt Sabre North - Cave 3'],
    mtSabreNorthCave4: [0x2c, 'Mt Sabre North - Cave 4'],
    mtSabreNorthCave5: [0x2d, 'Mt Sabre North - Cave 5'],
    mtSabreNorthCave6: [0x2e, 'Mt Sabre North - Cave 6'],
    mtSabreNorthPrisonHall: [0x2f, 'Mt Sabre North - Prison Hall'],
    mtSabreNorthLeftCell: [0x30, 'Mt Sabre North - Left Cell'],
    mtSabreNorthLeftCell2: [0x31, 'Mt Sabre North - Left Cell 2'],
    mtSabreNorthRightCell: [0x32, 'Mt Sabre North - Right Cell'],
    mtSabreNorthCave8: [0x33, 'Mt Sabre North - Cave 8'],
    mtSabreNorthCave9: [0x34, 'Mt Sabre North - Cave 9'],
    mtSabreNorthSummitCave: [0x35, 'Mt Sabre North - Summit Cave'],
    mtSabreNorthCave1: [0x38, 'Mt Sabre North - Cave 1'],
    mtSabreNorthCave7: [0x39, 'Mt Sabre North - Cave 7'],
    nadareInn: [0x3c, 'Nadare - Inn'],
    nadareToolShop: [0x3d, 'Nadare - Tool Shop'],
    nadareBackRoom: [0x3e, 'Nadare - Back Room'],
    waterfallValleyNorth: [0x40, 'Waterfall Valley North'],
    waterfallValleySouth: [0x41, 'Waterfall Valley South'],
    limeTreeValley: [0x42, 'Lime Tree Valley'],
    limeTreeLake: [0x43, 'Lime Tree Lake'],
    kirisaPlantCave1: [0x44, 'Kirisa Plant Cave 1'],
    kirisaPlantCave2: [0x45, 'Kirisa Plant Cave 2'],
    kirisaPlantCave3: [0x46, 'Kirisa Plant Cave 3'],
    kirisaMeadow: [0x47, 'Kirisa Meadow'],
    fogLampCave1: [0x48, 'Fog Lamp Cave 1'],
    fogLampCave2: [0x49, 'Fog Lamp Cave 2'],
    fogLampCave3: [0x4a, 'Fog Lamp Cave 3'],
    fogLampCaveDeadEnd: [0x4b, 'Fog Lamp Cave Dead End'],
    fogLampCave4: [0x4c, 'Fog Lamp Cave 4'],
    fogLampCave5: [0x4d, 'Fog Lamp Cave 5'],
    fogLampCave6: [0x4e, 'Fog Lamp Cave 6'],
    fogLampCave7: [0x4f, 'Fog Lamp Cave 7'],
    portoa: [0x50, 'Portoa'],
    portoaFishermanIsland: [0x51, 'Portoa - Fisherman Island'],
    mesiaShrine: [0x52, 'Mesia Shrine'],
    waterfallCave1: [0x54, 'Waterfall Cave 1'],
    waterfallCave2: [0x55, 'Waterfall Cave 2'],
    waterfallCave3: [0x56, 'Waterfall Cave 3'],
    waterfallCave4: [0x57, 'Waterfall Cave 4'],
    towerEntrance: [0x58, 'Tower - Entrance'],
    tower1: [0x59, 'Tower 1'],
    tower2: [0x5a, 'Tower 2'],
    tower3: [0x5b, 'Tower 3'],
    towerOutsideMesia: [0x5c, 'Tower - Outside Mesia'],
    towerOutsideDyna: [0x5d, 'Tower - Outside Dyna'],
    towerMesia: [0x5e, 'Tower - Mesia'],
    towerDyna: [0x5f, 'Tower - Dyna'],
    angrySea: [0x60, 'Angry Sea'],
    boatHouse: [0x61, 'Boat House'],
    joelLighthouse: [0x62, 'Joel - Lighthouse'],
    undergroundChannel: [0x64, 'Underground Channel'],
    zombieTown: [0x65, 'Zombie Town'],
    evilSpiritIsland1: [0x68, 'Evil Spirit Island 1'],
    evilSpiritIsland2: [0x69, 'Evil Spirit Island 2'],
    evilSpiritIsland3: [0x6a, 'Evil Spirit Island 3'],
    evilSpiritIsland4: [0x6b, 'Evil Spirit Island 4'],
    saberaPalace1: [0x6c, 'Sabera Palace 1'],
    saberaPalace2: [0x6d, 'Sabera Palace 2'],
    saberaPalace3: [0x6e, 'Sabera Palace 3'],
    joelSecretPassage: [0x70, 'Joel - Secret Passage'],
    joel: [0x71, 'Joel'],
    swan: [0x72, 'Swan'],
    swanGate: [0x73, 'Swan - Gate'],
    goaValley: [0x78, 'Goa Valley'],
    mtHydra: [0x7c, 'Mt Hydra'],
    mtHydraCave1: [0x7d, 'Mt Hydra - Cave 1'],
    mtHydraOutsideShyron: [0x7e, 'Mt Hydra - Outside Shyron'],
    mtHydraCave2: [0x7f, 'Mt Hydra - Cave 2'],
    mtHydraCave3: [0x80, 'Mt Hydra - Cave 3'],
    mtHydraCave4: [0x81, 'Mt Hydra - Cave 4'],
    mtHydraCave5: [0x82, 'Mt Hydra - Cave 5'],
    mtHydraCave6: [0x83, 'Mt Hydra - Cave 6'],
    mtHydraCave7: [0x84, 'Mt Hydra - Cave 7'],
    mtHydraCave8: [0x85, 'Mt Hydra - Cave 8'],
    mtHydraCave9: [0x86, 'Mt Hydra - Cave 9'],
    mtHydraCave10: [0x87, 'Mt Hydra - Cave 10'],
    styx1: [0x88, 'Styx 1'],
    styx2: [0x89, 'Styx 2'],
    styx3: [0x8a, 'Styx 3'],
    shyron: [0x8c, 'Shyron'],
    goa: [0x8e, 'Goa'],
    goaFortressOasisEntrance: [0x8f, 'Goa Fortress - Oasis Entrance'],
    desert1: [0x90, 'Desert 1'],
    oasisCaveMain: [0x91, 'Oasis Cave - Main'],
    desertCave1: [0x92, 'Desert Cave 1'],
    sahara: [0x93, 'Sahara'],
    saharaOutsideCave: [0x94, 'Sahara - Outside Cave'],
    desertCave2: [0x95, 'Desert Cave 2'],
    saharaMeadow: [0x96, 'Sahara Meadow'],
    desert2: [0x98, 'Desert 2'],
    pyramidEntrance: [0x9c, 'Pyramid - Entrance'],
    pyramidBranch: [0x9d, 'Pyramid - Branch'],
    pyramidMain: [0x9e, 'Pyramid - Main'],
    pyramidDraygon: [0x9f, 'Pyramid - Draygon'],
    cryptEntrance: [0xa0, 'Crypt - Entrance'],
    cryptHall1: [0xa1, 'Crypt - Hall 1'],
    cryptBranch: [0xa2, 'Crypt - Branch'],
    cryptDeadEndLeft: [0xa3, 'Crypt - Dead End Left'],
    cryptDeadEndRight: [0xa4, 'Crypt - Dead End Right'],
    cryptHall2: [0xa5, 'Crypt - Hall 2'],
    cryptDraygon2: [0xa6, 'Crypt - Draygon 2'],
    cryptTeleporter: [0xa7, 'Crypt - Teleporter'],
    goaFortressEntrance: [0xa8, 'Goa Fortress - Entrance'],
    goaFortressKelbesque: [0xa9, 'Goa Fortress - Kelbesque'],
    goaFortressZebu: [0xaa, 'Goa Fortress - Zebu'],
    goaFortressSabera: [0xab, 'Goa Fortress - Sabera'],
    goaFortressTornel: [0xac, 'Goa Fortress - Tornel'],
    goaFortressMado1: [0xad, 'Goa Fortress - Mado 1'],
    goaFortressMado2: [0xae, 'Goa Fortress - Mado 2'],
    goaFortressMado3: [0xaf, 'Goa Fortress - Mado 3'],
    goaFortressKarmine1: [0xb0, 'Goa Fortress - Karmine 1'],
    goaFortressKarmine2: [0xb1, 'Goa Fortress - Karmine 2'],
    goaFortressKarmine3: [0xb2, 'Goa Fortress - Karmine 3'],
    goaFortressKarmine4: [0xb3, 'Goa Fortress - Karmine 4'],
    goaFortressKarmine5: [0xb4, 'Goa Fortress - Karmine 5'],
    goaFortressKarmine6: [0xb5, 'Goa Fortress - Karmine 6'],
    goaFortressKarmine7: [0xb6, 'Goa Fortress - Karmine 7'],
    goaFortressExit: [0xb7, 'Goa Fortress - Exit'],
    oasisCaveEntrance: [0xb8, 'Oasis Cave - Entrance'],
    goaFortressAsina: [0xb9, 'Goa Fortress - Asina'],
    goaFortressKensu: [0xba, 'Goa Fortress - Kensu'],
    goaHouse: [0xbb, 'Goa - House'],
    goaInn: [0xbc, 'Goa - Inn'],
    goaToolShop: [0xbe, 'Goa - Tool Shop'],
    goaTavern: [0xbf, 'Goa - Tavern'],
    leafElderHouse: [0xc0, 'Leaf - Elder House'],
    leafRabbitHut: [0xc1, 'Leaf - Rabbit Hut'],
    leafInn: [0xc2, 'Leaf - Inn'],
    leafToolShop: [0xc3, 'Leaf - Tool Shop'],
    leafArmorShop: [0xc4, 'Leaf - Armor Shop'],
    leafStudentHouse: [0xc5, 'Leaf - Student House'],
    brynmaerTavern: [0xc6, 'Brynmaer - Tavern'],
    brynmaerPawnShop: [0xc7, 'Brynmaer - Pawn Shop'],
    brynmaerInn: [0xc8, 'Brynmaer - Inn'],
    brynmaerArmorShop: [0xc9, 'Brynmaer - Armor Shop'],
    brynmaerItemShop: [0xcb, 'Brynmaer - Item Shop'],
    oakElderHouse: [0xcd, 'Oak - Elder House'],
    oakMotherHouse: [0xce, 'Oak - Mother House'],
    oakToolShop: [0xcf, 'Oak - Tool Shop'],
    oakInn: [0xd0, 'Oak - Inn'],
    amazonesInn: [0xd1, 'Amazones - Inn'],
    amazonesItemShop: [0xd2, 'Amazones - Item Shop'],
    amazonesArmorShop: [0xd3, 'Amazones - Armor Shop'],
    amazonesElder: [0xd4, 'Amazones - Elder'],
    nadare: [0xd5, 'Nadare'],
    portoaFishermanHouse: [0xd6, 'Portoa - Fisherman House'],
    portoaPalaceEntrance: [0xd7, 'Portoa - Palace Entrance'],
    portoaFortuneTeller: [0xd8, 'Portoa - Fortune Teller'],
    portoaPawnShop: [0xd9, 'Portoa - Pawn Shop'],
    portoaArmorShop: [0xda, 'Portoa - Armor Shop'],
    portoaInn: [0xdc, 'Portoa - Inn'],
    portoaToolShop: [0xdd, 'Portoa - Tool Shop'],
    portoaPalaceLeft: [0xde, 'Portoa - Palace Left'],
    portoaPalaceThroneRoom: [0xdf, 'Portoa - Palace Throne Room'],
    portoaPalaceRight: [0xe0, 'Portoa - Palace Right'],
    portoaAsinaRoom: [0xe1, 'Portoa - Asina Room'],
    amazonesElderDownstairs: [0xe2, 'Amazones - Elder Downstairs'],
    joelElderHouse: [0xe3, 'Joel - Elder House'],
    joelShed: [0xe4, 'Joel - Shed'],
    joelToolShop: [0xe5, 'Joel - Tool Shop'],
    joelInn: [0xe7, 'Joel - Inn'],
    zombieTownHouse: [0xe8, 'Zombie Town - House'],
    zombieTownHouseBasement: [0xe9, 'Zombie Town - House Basement'],
    swanToolShop: [0xeb, 'Swan - Tool Shop'],
    swanStomHut: [0xec, 'Swan - Stom Hut'],
    swanInn: [0xed, 'Swan - Inn'],
    swanArmorShop: [0xee, 'Swan - Armor Shop'],
    swanTavern: [0xef, 'Swan - Tavern'],
    swanPawnShop: [0xf0, 'Swan - Pawn Shop'],
    swanDanceHall: [0xf1, 'Swan - Dance Hall'],
    shyronFortress: [0xf2, 'Shyron - Fortress'],
    shyronTrainingHall: [0xf3, 'Shyron - Training Hall'],
    shyronHospital: [0xf4, 'Shyron - Hospital'],
    shyronArmorShop: [0xf5, 'Shyron - Armor Shop'],
    shyronToolShop: [0xf6, 'Shyron - Tool Shop'],
    shyronInn: [0xf7, 'Shyron - Inn'],
    saharaInn: [0xf8, 'Sahara - Inn'],
    saharaToolShop: [0xf9, 'Sahara - Tool Shop'],
    saharaElderHouse: [0xfa, 'Sahara - Elder House'],
    saharaPawnShop: [0xfb, 'Sahara - Pawn Shop'],
};
const screenExits = {
    0x15: [37024, [0x89, 0x8a]],
    0x19: [24720, [0x58, 0x59]],
    0x96: [16432, [0x32, 0x33]],
    0x97: [44848, [0xb2, 0xb3]],
    0x98: [16592, [0x3c, 0x3d]],
    0x99: [45008, [0xbc, 0xbd]],
    0x9a: [8064, [0x27, 0x28]],
    0x9e: [57216, [0xe7, 0xe8]],
    0xc2: [24752, [0x5a, 0x5b]],
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9jYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvanMvcm9tL2xvY2F0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLE9BQU8sRUFBQyxNQUFNLEVBQUMsTUFBTSxhQUFhLENBQUM7QUFFbkMsT0FBTyxFQUFPLFNBQVMsRUFDZixlQUFlLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxXQUFXLEVBQ3hDLGdCQUFnQixFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUN0QyxpQkFBaUIsRUFBRSxrQkFBa0IsRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUdoRSxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFDMUMsT0FBTyxFQUFDLFdBQVcsRUFBRSxLQUFLLEVBQUUsVUFBVSxFQUFDLE1BQU0sWUFBWSxDQUFDO0FBdUIxRCxNQUFNLElBQUksR0FBRztJQUNYLE9BQU8sRUFBRSxNQUFNO0lBQ2YsS0FBSyxFQUFFLENBQUMsSUFBVSxFQUFFLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLE9BQU87SUFDMUMsT0FBTyxFQUFFLENBQUMsSUFBVSxFQUFFLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLE9BQU87Q0FDcEMsQ0FBQztBQUNYLE1BQU0sS0FBSyxHQUFHO0lBQ1osT0FBTyxFQUFFLE9BQU87SUFDaEIsT0FBTyxFQUFFLEdBQUcsRUFBRSxDQUFDLE1BQU0sRUFBRTtDQUNmLENBQUM7QUFDWCxNQUFNLGNBQWMsR0FBRztJQUNyQixPQUFPLEVBQUUsT0FBTztJQUNoQixPQUFPLEVBQUUsR0FBRyxFQUFFLENBQUMsTUFBTSxFQUFFO0lBQ3ZCLEtBQUssRUFBRSxDQUFDLElBQVUsRUFBRSxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxnQkFBZ0I7Q0FDM0MsQ0FBQztBQUNYLE1BQU0sS0FBSyxHQUFHO0lBQ1osSUFBSSxFQUFFLE9BQU87SUFDYixLQUFLLEVB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R0FBRyxDQUFDLENBQUMsQ0FBQztLQUM3RDtJQUNELElBQUksQ0FBQyxFQUFFO1FBQ0wsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQztLQUM3RDtJQUNELE9BQU8sR0FBRyxDQUFDO0FBQ2IsQ0FBQztBQUVELE1BQU0sQ0FBQyxNQUFNLFFBQVEsR0FBRyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRTtJQUN4QyxDQUFDLEVBQUUsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3JDLENBQUMsRUFBRSxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFFckMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDaEQsSUFBSSxFQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQy9DLEtBQUssRUFBRyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBRWhELElBQUksRUFBRTtRQUNKLEdBQUcsS0FBdUIsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUM7S0FDekQ7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UUFDTixPQUFPLFFBQVEsSUFBSSxDQUFDLEdBQUcsRUFBRSxNQUFNLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEtBQUssR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsT0FDcEQsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO0lBQzNCLENBQUM7Q0FDRixDQUFDLENBQUM7QUFHSCxNQUFNLENBQUMsTUFBTSxHQUFHLEdBQUcsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUU7SUFDbkMsTUFBTSxFQUFHLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ3JDLElBQUksRUFBSyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBRWxDLE1BQU0sRUFBRyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztJQUNyQyxJQUFJLEVBQUssU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUVsQyxJQUFJLEVBQUssU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBRTVCLFFBQVE7UUFDTixPQUFPLE9BQU8sSUFBSSxDQUFDLEdBQUcsRUFBRSxNQUFNLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsUUFDM0QsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQztJQUNsRSxDQUFDO0NBQ0YsQ0FBQyxDQUFDO0FBR0gsTUFBTSxDQUFDLE1BQU0sS0FBSyxHQUFHLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFO0lBQ3JDLENBQUMsRUFBTSxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3BDLEVBQUUsRUFBSyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFFMUIsS0FBSyxFQUFFLFNBQVMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQzFDLENBQUMsRUFBTSxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztJQUNsRCxFQUFFLEVBQUssU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUVoQyxNQUFNLEVBQUUsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDL0MsSUFBSSxFQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFFaEQsV0FBVyxFQUFFLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ3pDLElBQUksRUFBRyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBS2hDLEVBQUUsRUFBSyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFFMUIsSUFBSSxFQUFFLEVBQUMsR0FBRyxLQUF1QixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQztRQUN6RCxHQUFHLENBQVksSUFBYSxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBQztJQUN6RSxTQUFTLEVBQUUsRUFBQyxHQUFHLEtBQXNCLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDMUQsR0FBRyxDQUFZLEVBQVUsSUFBSSxJQUFJLENBQUMsRUFBRSxHQUFHLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBQztJQUV6RSxPQUFPLEtBQXVCLE9BQU8sSUFBSSxDQUFDLElBQUksS0FBSyxDQUFDLElBQUksSUFBSSxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQ3pFLFdBQVc7UUFDVCxPQUFPLElBQUksQ0FBQyxPQUFPLEVBQUUsSUFBSSxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQztJQUN4RCxDQUFDO0lBQ0QsU0FBUyxLQUF1QixPQUFPLElBQUksQ0FBQyxJQUFJLEtBQUssQ0FBQyxJQUFJLElBQUksQ0FBQyxFQUFFLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQztJQUM1RSxLQUFLLEtBQXVCLE9BQU8sSUFBSSxDQUFDLElBQUksS0FBSyxDQUFDLElBQUksSUFBSSxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQ3ZFLE1BQU0sS0FBdUIsT0FBTyxJQUFJLENBQUMsSUFBSSxLQUFLLENBQUMsSUFBSSxJQUFJLENBQUMsRUFBRSxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDekUsU0FBUyxLQUF1QixPQUFPLElBQUksQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN6RCxNQUFNO1FBQ0osT0FBTyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzVFLENBQUM7SUFDRCxjQUFjLENBQVksUUFBa0I7UUFDMUMsT0FBTyxJQUFJLENBQUMsTUFBTSxFQUFFO1lBQ2hCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDO2dCQUMzQyxRQUFRLENBQUMsRUFBRSxLQUFLLElBQUksSUFBSSxRQUFRLENBQUMsRUFBRSxLQUFLLElBQUksQ0FBQyxDQUFDO0lBQ3ZELENBQUM7SUFDRCxRQUFRO1FBQ04sSUFBSSxJQUFJLENBQUMsSUFBSSxLQUFLLENBQUM7WUFBRSxPQUFPLEVBQUUsQ0FBQztRQUMvQixNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7UUFDMUQsSUFBSSxHQUFHLElBQUksQ0FBQztZQUFFLE9BQU8sRUFBRSxDQUFDO1FBQ3hCLE9BQU8sR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUM7SUFDdkMsQ0FBQztJQUNELFdBQVc7UUFDVCxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRTtZQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFDOUIsT0FBTyxJQUFJLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztJQUNyQixDQUFDO0lBQ0QsUUFBUTtRQUNOLE9BQU8sU0FBUyxJQUFJLENBQUMsR0FBRyxFQUFFLE1BQU0sR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUNuRCxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLE9BQU8sSUFBSSxJQUFJLENBQUMsSUFBSSxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQztJQUN4RSxDQUFDO0NBQ0YsQ0FBQyxDQUFDO0FBR0gsTUFBTSxDQUFDLE1BQU0sU0FBUyxHQUFHO0lBQ3ZCLFlBQVksRUFBRSxDQUFDLElBQUksRUFBRSxlQUFlLENBQUM7SUFDckMsZ0JBQWdCLEVBQUUsQ0FBQyxJQUFJLEVBQUUsc0JBQXNCLENBQUM7SUFDaEQsSUFBSSxFQUFFLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQztJQUNwQixZQUFZLEVBQUUsQ0FBQyxJQUFJLEVBQUUsZ0JBQWdCLENBQUM7SUFDdEMsV0FBVyxFQUFFLENBQUMsSUFBSSxFQUFFLGVBQWUsQ0FBQztJQUNwQyxXQUFXLEVBQUUsQ0FBQyxJQUFJLEVBQUUsZUFBZSxDQUFDO0lBQ3BDLFdBQVcsRUFBRSxDQUFDLElBQUksRUFBRSxlQUFlLENBQUM7SUFDcEMsV0FBVyxFQUFFLENBQUMsSUFBSSxFQUFFLGVBQWUsQ0FBQztJQUNwQyxXQUFXLEVBQUUsQ0FBQyxJQUFJLEVBQUUsZUFBZSxDQUFDO0lBQ3BDLFdBQVcsRUFBRSxDQUFDLElBQUksRUFBRSxlQUFlLENBQUM7SUFDcEMsV0FBVyxFQUFFLENBQUMsSUFBSSxFQUFFLGVBQWUsQ0FBQztJQUVwQyxXQUFXLEVBQUUsQ0FBQyxJQUFJLEVBQUUsZUFBZSxDQUFDO0lBRXBDLFlBQVksRUFBRSxDQUFDLElBQUksRUFBRSxlQUFlLENBQUM7SUFDckMsUUFBUSxFQUFFLENBQUMsSUFBSSxFQUFFLFVBQVUsQ0FBQztJQUM1QixRQUFRLEVBQUUsQ0FBQyxJQUFJLEVBQUUsV0FBVyxDQUFDO0lBQzdCLGdCQUFnQixFQUFFLENBQUMsSUFBSSxFQUFFLHdCQUF3QixDQUFDO0lBR2xELGdCQUFnQixFQUFFLENBQUMsSUFBSSxFQUFFLG9CQUFvQixDQUFDO0lBQzlDLGdCQUFnQixFQUFFLENBQUMsSUFBSSxFQUFFLG9CQUFvQixDQUFDO0lBRzlDLFFBQVEsRUFBRSxDQUFDLElBQUksRUFBRSxVQUFVLENBQUM7SUFDNUIsZ0JBQWdCLEVBQUUsQ0FBQyxJQUFJLEVBQUUsb0JBQW9CLENBQUM7SUFDOUMsS0FBSyxFQUFFLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQztJQUN0QixRQUFRLEVBQUUsQ0FBQyxJQUFJLEVBQUUsVUFBVSxDQUFDO0lBQzVCLEdBQUcsRUFBRSxDQUFDLElBQUksRUFBRSxLQUFLLENBQUM7SUFFbEIsU0FBUyxFQUFFLENBQUMsSUFBSSxFQUFFLFlBQVksQ0FBQztJQUUvQixnQkFBZ0IsRUFBRSxDQUFDLElBQUksRUFBRSx1QkFBdUIsQ0FBQztJQUNqRCxnQkFBZ0IsRUFBRSxDQUFDLElBQUksRUFBRSx1QkFBdUIsQ0FBQztJQUNqRCxnQkFBZ0IsRUFBRSxDQUFDLElBQUksRUFBRSx3QkFBd0IsQ0FBQztJQUNsRCxnQkFBZ0IsRUFBRSxDQUFDLElBQUksRUFBRSx3QkFBd0IsQ0FBQztJQUNsRCxnQkFBZ0IsRUFBRSxDQUFDLElBQUksRUFBRSx3QkFBd0IsQ0FBQztJQUNsRCxnQkFBZ0IsRUFBRSxDQUFDLElBQUksRUFBRSx3QkFBd0IsQ0FBQztJQUNsRCxnQkFBZ0IsRUFBRSxDQUFDLElBQUksRUFBRSx3QkFBd0IsQ0FBQztJQUNsRCxnQkFBZ0IsRUFBRSxDQUFDLElBQUksRUFBRSx3QkFBd0IsQ0FBQztJQUNsRCxnQkFBZ0IsRUFBRSxDQUFDLElBQUksRUFBRSx1QkFBdUIsQ0FBQztJQUNqRCxrQkFBa0IsRUFBRSxDQUFDLElBQUksRUFBRSx5QkFBeUIsQ0FBQztJQUNyRCxpQkFBaUIsRUFBRSxDQUFDLElBQUksRUFBRSx5QkFBeUIsQ0FBQztJQUNwRCxpQkFBaUIsRUFBRSxDQUFDLElBQUksRUFBRSx5QkFBeUIsQ0FBQztJQUNwRCxpQkFBaUIsRUFBRSxDQUFDLElBQUksRUFBRSx5QkFBeUIsQ0FBQztJQUNwRCxpQkFBaUIsRUFBRSxDQUFDLElBQUksRUFBRSx5QkFBeUIsQ0FBQztJQUNwRCxpQkFBaUIsRUFBRSxDQUFDLElBQUksRUFBRSx5QkFBeUIsQ0FBQztJQUNwRCxzQkFBc0IsRUFBRSxDQUFDLElBQUksRUFBRSw4QkFBOEIsQ0FBQztJQUM5RCxvQkFBb0IsRUFBRSxDQUFDLElBQUksRUFBRSw0QkFBNEIsQ0FBQztJQUMxRCxxQkFBcUIsRUFBRSxDQUFDLElBQUksRUFBRSw4QkFBOEIsQ0FBQztJQUM3RCxxQkFBcUIsRUFBRSxDQUFDLElBQUksRUFBRSw2QkFBNkIsQ0FBQztJQUM1RCxpQkFBaUIsRUFBRSxDQUFDLElBQUksRUFBRSx5QkFBeUIsQ0FBQztJQUNwRCxpQkFBaUIsRUFBRSxDQUFDLElBQUksRUFBRSx5QkFBeUIsQ0FBQztJQUNwRCxzQkFBc0IsRUFBRSxDQUFDLElBQUksRUFBRSw4QkFBOEIsQ0FBQztJQUc5RCxpQkFBaUIsRUFBRSxDQUFDLElBQUksRUFBRSx5QkFBeUIsQ0FBQztJQUNwRCxpQkFBaUIsRUFBRSxDQUFDLElBQUksRUFBRSx5QkFBeUIsQ0FBQztJQUdwRCxTQUFTLEVBQUUsQ0FBQyxJQUFJLEVBQUUsY0FBYyxDQUFDO0lBQ2pDLGNBQWMsRUFBRSxDQUFDLElBQUksRUFBRSxvQkFBb0IsQ0FBQztJQUM1QyxjQUFjLEVBQUUsQ0FBQyxJQUFJLEVBQUUsb0JBQW9CLENBQUM7SUFFNUMsb0JBQW9CLEVBQUUsQ0FBQyxJQUFJLEVBQUUsd0JBQXdCLENBQUM7SUFDdEQsb0JBQW9CLEVBQUUsQ0FBQyxJQUFJLEVBQUUsd0JBQXdCLENBQUM7SUFDdEQsY0FBYyxFQUFFLENBQUMsSUFBSSxFQUFFLGtCQUFrQixDQUFDO0lBQzFDLFlBQVksRUFBRSxDQUFDLElBQUksRUFBRSxnQkFBZ0IsQ0FBQztJQUN0QyxnQkFBZ0IsRUFBRSxDQUFDLElBQUksRUFBRSxxQkFBcUIsQ0FBQztJQUMvQyxnQkFBZ0IsRUFBRSxDQUFDLElBQUksRUFBRSxxQkFBcUIsQ0FBQztJQUMvQyxnQkFBZ0IsRUFBRSxDQUFDLElBQUksRUFBRSxxQkFBcUIsQ0FBQztJQUMvQyxZQUFZLEVBQUUsQ0FBQyxJQUFJLEVBQUUsZUFBZSxDQUFDO0lBQ3JDLFlBQVksRUFBRSxDQUFDLElBQUksRUFBRSxpQkFBaUIsQ0FBQztJQUN2QyxZQUFZLEVBQUUsQ0FBQyxJQUFJLEVBQUUsaUJBQWlCLENBQUM7SUFDdkMsWUFBWSxFQUFFLENBQUMsSUFBSSxFQUFFLGlCQUFpQixDQUFDO0lBQ3ZDLGtCQUFrQixFQUFFLENBQUMsSUFBSSxFQUFFLHdCQUF3QixDQUFDO0lBQ3BELFlBQVksRUFBRSxDQUFDLElBQUksRUFBRSxpQkFBaUIsQ0FBQztJQUN2QyxZQUFZLEVBQUUsQ0FBQyxJQUFJLEVBQUUsaUJBQWlCLENBQUM7SUFDdkMsWUFBWSxFQUFFLENBQUMsSUFBSSxFQUFFLGlCQUFpQixDQUFDO0lBQ3ZDLFlBQVksRUFBRSxDQUFDLElBQUksRUFBRSxpQkFBaUIsQ0FBQztJQUN2QyxNQUFNLEVBQUUsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDO0lBQ3hCLHFCQUFxQixFQUFFLENBQUMsSUFBSSxFQUFFLDJCQUEyQixDQUFDO0lBQzFELFdBQVcsRUFBRSxDQUFDLElBQUksRUFBRSxjQUFjLENBQUM7SUFFbkMsY0FBYyxFQUFFLENBQUMsSUFBSSxFQUFFLGtCQUFrQixDQUFDO0lBQzFDLGNBQWMsRUFBRSxDQUFDLElBQUksRUFBRSxrQkFBa0IsQ0FBQztJQUMxQyxjQUFjLEVBQUUsQ0FBQyxJQUFJLEVBQUUsa0JBQWtCLENBQUM7SUFDMUMsY0FBYyxFQUFFLENBQUMsSUFBSSxFQUFFLGtCQUFrQixDQUFDO0lBQzFDLGFBQWEsRUFBRSxDQUFDLElBQUksRUFBRSxrQkFBa0IsQ0FBQztJQUN6QyxNQUFNLEVBQUUsQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDO0lBQ3pCLE1BQU0sRUFBRSxDQUFDLElBQUksRUFBRSxTQUFTLENBQUM7SUFDekIsTUFBTSxFQUFFLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQztJQUN6QixpQkFBaUIsRUFBRSxDQUFDLElBQUksRUFBRSx1QkFBdUIsQ0FBQztJQUNsRCxnQkFBZ0IsRUFBRSxDQUFDLElBQUksRUFBRSxzQkFBc0IsQ0FBQztJQUNoRCxVQUFVLEVBQUUsQ0FBQyxJQUFJLEVBQUUsZUFBZSxDQUFDO0lBQ25DLFNBQVMsRUFBRSxDQUFDLElBQUksRUFBRSxjQUFjLENBQUM7SUFDakMsUUFBUSxFQUFFLENBQUMsSUFBSSxFQUFFLFdBQVcsQ0FBQztJQUM3QixTQUFTLEVBQUUsQ0FBQyxJQUFJLEVBQUUsWUFBWSxDQUFDO0lBQy9CLGNBQWMsRUFBRSxDQUFDLElBQUksRUFBRSxtQkFBbUIsQ0FBQztJQUUzQyxrQkFBa0IsRUFBRSxDQUFDLElBQUksRUFBRSxxQkFBcUIsQ0FBQztJQUNqRCxVQUFVLEVBQUUsQ0FBQyxJQUFJLEVBQUUsYUFBYSxDQUFDO0lBR2pDLGlCQUFpQixFQUFFLENBQUMsSUFBSSxFQUFFLHNCQUFzQixDQUFDO0lBQ2pELGlCQUFpQixFQUFFLENBQUMsSUFBSSxFQUFFLHNCQUFzQixDQUFDO0lBQ2pELGlCQUFpQixFQUFFLENBQUMsSUFBSSxFQUFFLHNCQUFzQixDQUFDO0lBQ2pELGlCQUFpQixFQUFFLENBQUMsSUFBSSxFQUFFLHNCQUFzQixDQUFDO0lBQ2pELGFBQWEsRUFBRSxDQUFDLElBQUksRUFBRSxpQkFBaUIsQ0FBQztJQUN4QyxhQUFhLEVBQUUsQ0FBQyxJQUFJLEVBQUUsaUJBQWlCLENBQUM7SUFDeEMsYUFBYSxFQUFFLENBQUMsSUFBSSxFQUFFLGlCQUFpQixDQUFDO0lBRXhDLGlCQUFpQixFQUFFLENBQUMsSUFBSSxFQUFFLHVCQUF1QixDQUFDO0lBQ2xELElBQUksRUFBRSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUM7SUFDcEIsSUFBSSxFQUFFLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQztJQUNwQixRQUFRLEVBQUUsQ0FBQyxJQUFJLEVBQUUsYUFBYSxDQUFDO0lBSy9CLFNBQVMsRUFBRSxDQUFDLElBQUksRUFBRSxZQUFZLENBQUM7SUFJL0IsT0FBTyxFQUFFLENBQUMsSUFBSSxFQUFFLFVBQVUsQ0FBQztJQUMzQixZQUFZLEVBQUUsQ0FBQyxJQUFJLEVBQUUsbUJBQW1CLENBQUM7SUFDekMsb0JBQW9CLEVBQUUsQ0FBQyxJQUFJLEVBQUUsMkJBQTJCLENBQUM7SUFDekQsWUFBWSxFQUFFLENBQUMsSUFBSSxFQUFFLG1CQUFtQixDQUFDO0lBQ3pDLFlBQVksRUFBRSxDQUFDLElBQUksRUFBRSxtQkFBbUIsQ0FBQztJQUN6QyxZQUFZLEVBQUUsQ0FBQyxJQUFJLEVBQUUsbUJBQW1CLENBQUM7SUFDekMsWUFBWSxFQUFFLENBQUMsSUFBSSxFQUFFLG1CQUFtQixDQUFDO0lBQ3pDLFlBQVksRUFBRSxDQUFDLElBQUksRUFBRSxtQkFBbUIsQ0FBQztJQUN6QyxZQUFZLEVBQUUsQ0FBQyxJQUFJLEVBQUUsbUJBQW1CLENBQUM7SUFDekMsWUFBWSxFQUFFLENBQUMsSUFBSSxFQUFFLG1CQUFtQixDQUFDO0lBQ3pDLFlBQVksRUFBRSxDQUFDLElBQUksRUFBRSxtQkFBbUIsQ0FBQztJQUN6QyxhQUFhLEVBQUUsQ0FBQyxJQUFJLEVBQUUsb0JBQW9CLENBQUM7SUFDM0MsS0FBSyxFQUFFLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQztJQUN2QixLQUFLLEVBQUUsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDO0lBQ3ZCLEtBQUssRUFBRSxDQUFDLElBQUksRUFBRSxRQUFRLENBQUM7SUFFdkIsTUFBTSxFQUFFLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQztJQUV4QixHQUFHLEVBQUUsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDO0lBQ2xCLHdCQUF3QixFQUFFLENBQUMsSUFBSSxFQUFFLCtCQUErQixDQUFDO0lBQ2pFLE9BQU8sRUFBRSxDQUFDLElBQUksRUFBRSxVQUFVLENBQUM7SUFDM0IsYUFBYSxFQUFFLENBQUMsSUFBSSxFQUFFLG1CQUFtQixDQUFDO0lBQzFDLFdBQVcsRUFBRSxDQUFDLElBQUksRUFBRSxlQUFlLENBQUM7SUFDcEMsTUFBTSxFQUFFLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQztJQUN4QixpQkFBaUIsRUFBRSxDQUFDLElBQUksRUFBRSx1QkFBdUIsQ0FBQztJQUNsRCxXQUFXLEVBQUUsQ0FBQyxJQUFJLEVBQUUsZUFBZSxDQUFDO0lBQ3BDLFlBQVksRUFBRSxDQUFDLElBQUksRUFBRSxlQUFlLENBQUM7SUFFckMsT0FBTyxFQUFFLENBQUMsSUFBSSxFQUFFLFVBQVUsQ0FBQztJQUkzQixlQUFlLEVBQUUsQ0FBQyxJQUFJLEVBQUUsb0JBQW9CLENBQUM7SUFDN0MsYUFBYSxFQUFFLENBQUMsSUFBSSxFQUFFLGtCQUFrQixDQUFDO0lBQ3pDLFdBQVcsRUFBRSxDQUFDLElBQUksRUFBRSxnQkFBZ0IsQ0FBQztJQUNyQyxjQUFjLEVBQUUsQ0FBQyxJQUFJLEVBQUUsbUJBQW1CLENBQUM7SUFDM0MsYUFBYSxFQUFFLENBQUMsSUFBSSxFQUFFLGtCQUFrQixDQUFDO0lBQ3pDLFVBQVUsRUFBRSxDQUFDLElBQUksRUFBRSxnQkFBZ0IsQ0FBQztJQUNwQyxXQUFXLEVBQUUsQ0FBQyxJQUFJLEVBQUUsZ0JBQWdCLENBQUM7SUFDckMsZ0JBQWdCLEVBQUUsQ0FBQyxJQUFJLEVBQUUsdUJBQXVCLENBQUM7SUFDakQsaUJBQWlCLEVBQUUsQ0FBQyxJQUFJLEVBQUUsd0JBQXdCLENBQUM7SUFDbkQsVUFBVSxFQUFFLENBQUMsSUFBSSxFQUFFLGdCQUFnQixDQUFDO0lBQ3BDLGFBQWEsRUFBRSxDQUFDLElBQUksRUFBRSxtQkFBbUIsQ0FBQztJQUMxQyxlQUFlLEVBQUUsQ0FBQyxJQUFJLEVBQUUsb0JBQW9CLENBQUM7SUFDN0MsbUJBQW1CLEVBQUUsQ0FBQyxJQUFJLEVBQUUseUJBQXlCLENBQUM7SUFDdEQsb0JBQW9CLEVBQUUsQ0FBQyxJQUFJLEVBQUUsMEJBQTBCLENBQUM7SUFDeEQsZUFBZSxFQUFFLENBQUMsSUFBSSxFQUFFLHFCQUFxQixDQUFDO0lBQzlDLGlCQUFpQixFQUFFLENBQUMsSUFBSSxFQUFFLHVCQUF1QixDQUFDO0lBQ2xELGlCQUFpQixFQUFFLENBQUMsSUFBSSxFQUFFLHVCQUF1QixDQUFDO0lBQ2xELGdCQUFnQixFQUFFLENBQUMsSUFBSSxFQUFFLHVCQUF1QixDQUFDO0lBQ2pELGdCQUFnQixFQUFFLENBQUMsSUFBSSxFQUFFLHVCQUF1QixDQUFDO0lBQ2pELGdCQUFnQixFQUFFLENBQUMsSUFBSSxFQUFFLHVCQUF1QixDQUFDO0lBQ2pELG1CQUFtQixFQUFFLENBQUMsSUFBSSxFQUFFLDBCQUEwQixDQUFDO0lBQ3ZELG1CQUFtQixFQUFFLENBQUMsSUFBSSxFQUFFLDBCQUEwQixDQUFDO0lBQ3ZELG1CQUFtQixFQUFFLENBQUMsSUFBSSxFQUFFLDBCQUEwQixDQUFDO0lBQ3ZELG1CQUFtQixFQUFFLENBQUMsSUFBSSxFQUFFLDBCQUEwQixDQUFDO0lBQ3ZELG1CQUFtQixFQUFFLENBQUMsSUFBSSxFQUFFLDBCQUEwQixDQUFDO0lBQ3ZELG1CQUFtQixFQUFFLENBQUMsSUFBSSxFQUFFLDBCQUEwQixDQUFDO0lBQ3ZELG1CQUFtQixFQUFFLENBQUMsSUFBSSxFQUFFLDBCQUEwQixDQUFDO0lBQ3ZELGVBQWUsRUFBRSxDQUFDLElBQUksRUFBRSxxQkFBcUIsQ0FBQztJQUM5QyxpQkFBaUIsRUFBRSxDQUFDLElBQUksRUFBRSx1QkFBdUIsQ0FBQztJQUNsRCxnQkFBZ0IsRUFBRSxDQUFDLElBQUksRUFBRSxzQkFBc0IsQ0FBQztJQUNoRCxnQkFBZ0IsRUFBRSxDQUFDLElBQUksRUFBRSxzQkFBc0IsQ0FBQztJQUNoRCxRQUFRLEVBQUUsQ0FBQyxJQUFJLEVBQUUsYUFBYSxDQUFDO0lBQy9CLE1BQU0sRUFBRSxDQUFDLElBQUksRUFBRSxXQUFXLENBQUM7SUFFM0IsV0FBVyxFQUFFLENBQUMsSUFBSSxFQUFFLGlCQUFpQixDQUFDO0lBQ3RDLFNBQVMsRUFBRSxDQUFDLElBQUksRUFBRSxjQUFjLENBQUM7SUFDakMsY0FBYyxFQUFFLENBQUMsSUFBSSxFQUFFLG9CQUFvQixDQUFDO0lBQzVDLGFBQWEsRUFBRSxDQUFDLElBQUksRUFBRSxtQkFBbUIsQ0FBQztJQUMxQyxPQUFPLEVBQUUsQ0FBQyxJQUFJLEVBQUUsWUFBWSxDQUFDO0lBQzdCLFlBQVksRUFBRSxDQUFDLElBQUksRUFBRSxrQkFBa0IsQ0FBQztJQUN4QyxhQUFhLEVBQUUsQ0FBQyxJQUFJLEVBQUUsbUJBQW1CLENBQUM7SUFDMUMsZ0JBQWdCLEVBQUUsQ0FBQyxJQUFJLEVBQUUsc0JBQXNCLENBQUM7SUFDaEQsY0FBYyxFQUFFLENBQUMsSUFBSSxFQUFFLG1CQUFtQixDQUFDO0lBQzNDLGdCQUFnQixFQUFFLENBQUMsSUFBSSxFQUFFLHNCQUFzQixDQUFDO0lBQ2hELFdBQVcsRUFBRSxDQUFDLElBQUksRUFBRSxnQkFBZ0IsQ0FBQztJQUNyQyxpQkFBaUIsRUFBRSxDQUFDLElBQUksRUFBRSx1QkFBdUIsQ0FBQztJQUVsRCxnQkFBZ0IsRUFBRSxDQUFDLElBQUksRUFBRSxzQkFBc0IsQ0FBQztJQUVoRCxhQUFhLEVBQUUsQ0FBQyxJQUFJLEVBQUUsbUJBQW1CLENBQUM7SUFDMUMsY0FBYyxFQUFFLENBQUMsSUFBSSxFQUFFLG9CQUFvQixDQUFDO0lBQzVDLFdBQVcsRUFBRSxDQUFDLElBQUksRUFBRSxpQkFBaUIsQ0FBQztJQUN0QyxNQUFNLEVBQUUsQ0FBQyxJQUFJLEVBQUUsV0FBVyxDQUFDO0lBQzNCLFdBQVcsRUFBRSxDQUFDLElBQUksRUFBRSxnQkFBZ0IsQ0FBQztJQUNyQyxnQkFBZ0IsRUFBRSxDQUFDLElBQUksRUFBRSxzQkFBc0IsQ0FBQztJQUNoRCxpQkFBaUIsRUFBRSxDQUFDLElBQUksRUFBRSx1QkFBdUIsQ0FBQztJQUNsRCxhQUFhLEVBQUUsQ0FBQyxJQUFJLEVBQUUsa0JBQWtCLENBQUM7SUFDekMsTUFBTSxFQUFFLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQztJQUN4QixvQkFBb0IsRUFBRSxDQUFDLElBQUksRUFBRSwwQkFBMEIsQ0FBQztJQUN4RCxvQkFBb0IsRUFBRSxDQUFDLElBQUksRUFBRSwwQkFBMEIsQ0FBQztJQUN4RCxtQkFBbUIsRUFBRSxDQUFDLElBQUksRUFBRSx5QkFBeUIsQ0FBQztJQUN0RCxjQUFjLEVBQUUsQ0FBQyxJQUFJLEVBQUUsb0JBQW9CLENBQUM7SUFDNUMsZUFBZSxFQUFFLENBQUMsSUFBSSxFQUFFLHFCQUFxQixDQUFDO0lBRTlDLFNBQVMsRUFBRSxDQUFDLElBQUksRUFBRSxjQUFjLENBQUM7SUFDakMsY0FBYyxFQUFFLENBQUMsSUFBSSxFQUFFLG9CQUFvQixDQUFDO0lBQzVDLGdCQUFnQixFQUFFLENBQUMsSUFBSSxFQUFFLHNCQUFzQixDQUFDO0lBQ2hELHNCQUFzQixFQUFFLENBQUMsSUFBSSxFQUFFLDZCQUE2QixDQUFDO0lBQzdELGlCQUFpQixFQUFFLENBQUMsSUFBSSxFQUFFLHVCQUF1QixDQUFDO0lBQ2xELGVBQWUsRUFBRSxDQUFDLElBQUksRUFBRSxxQkFBcUIsQ0FBQztJQUM5Qyx1QkFBdUIsRUFBRSxDQUFDLElBQUksRUFBRSw2QkFBNkIsQ0FBQztJQUM5RCxjQUFjLEVBQUUsQ0FBQyxJQUFJLEVBQUUsb0JBQW9CLENBQUM7SUFDNUMsUUFBUSxFQUFFLENBQUMsSUFBSSxFQUFFLGFBQWEsQ0FBQztJQUMvQixZQUFZLEVBQUUsQ0FBQyxJQUFJLEVBQUUsa0JBQWtCLENBQUM7SUFFeEMsT0FBTyxFQUFFLENBQUMsSUFBSSxFQUFFLFlBQVksQ0FBQztJQUM3QixlQUFlLEVBQUUsQ0FBQyxJQUFJLEVBQUUscUJBQXFCLENBQUM7SUFDOUMsdUJBQXVCLEVBQUUsQ0FBQyxJQUFJLEVBQUUsOEJBQThCLENBQUM7SUFFL0QsWUFBWSxFQUFFLENBQUMsSUFBSSxFQUFFLGtCQUFrQixDQUFDO0lBQ3hDLFdBQVcsRUFBRSxDQUFDLElBQUksRUFBRSxpQkFBaUIsQ0FBQztJQUN0QyxPQUFPLEVBQUUsQ0FBQyxJQUFJLEVBQUUsWUFBWSxDQUFDO0lBQzdCLGFBQWEsRUFBRSxDQUFDLElBQUksRUFBRSxtQkFBbUIsQ0FBQztJQUMxQyxVQUFVLEVBQUUsQ0FBQyxJQUFJLEVBQUUsZUFBZSxDQUFDO0lBQ25DLFlBQVksRUFBRSxDQUFDLElBQUksRUFBRSxrQkFBa0IsQ0FBQztJQUN4QyxhQUFhLEVBQUUsQ0FBQyxJQUFJLEVBQUUsbUJBQW1CLENBQUM7SUFDMUMsY0FBYyxFQUFFLENBQUMsSUFBSSxFQUFFLG1CQUFtQixDQUFDO0lBQzNDLGtCQUFrQixFQUFFLENBQUMsSUFBSSxFQUFFLHdCQUF3QixDQUFDO0lBQ3BELGNBQWMsRUFBRSxDQUFDLElBQUksRUFBRSxtQkFBbUIsQ0FBQztJQUMzQyxlQUFlLEVBQUUsQ0FBQyxJQUFJLEVBQUUscUJBQXFCLENBQUM7SUFDOUMsY0FBYyxFQUFFLENBQUMsSUFBSSxFQUFFLG9CQUFvQixDQUFDO0lBQzVDLFNBQVMsRUFBRSxDQUFDLElBQUksRUFBRSxjQUFjLENBQUM7SUFDakMsU0FBUyxFQUFFLENBQUMsSUFBSSxFQUFFLGNBQWMsQ0FBQztJQUNqQyxjQUFjLEVBQUUsQ0FBQyxJQUFJLEVBQUUsb0JBQW9CLENBQUM7SUFDNUMsZ0JBQWdCLEVBQUUsQ0FBQyxJQUFJLEVBQUUsc0JBQXNCLENBQUM7SUFDaEQsY0FBYyxFQUFFLENBQUMsSUFBSSxFQUFFLG9CQUFvQixDQUFDO0NBQ3BDLENBQUM7QUF5Q1gsTUFBTSxXQUFXLEdBQWlFO0lBQ2hGLElBQUksRUFBRSxDQUFDLEtBQU8sRUFBRSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztJQUM3QixJQUFJLEVBQUUsQ0FBQyxLQUFPLEVBQUUsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDN0IsSUFBSSxFQUFFLENBQUMsS0FBTyxFQUFFLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQzdCLElBQUksRUFBRSxDQUFDLEtBQU8sRUFBRSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztJQUM3QixJQUFJLEVBQUUsQ0FBQyxLQUFPLEVBQUUsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDN0IsSUFBSSxFQUFFLENBQUMsS0FBTyxFQUFFLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQzdCLElBQUksRUFBRSxDQUFDLElBQU8sRUFBRSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztJQUM3QixJQUFJLEVBQUUsQ0FBQyxLQUFPLEVBQUUsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDN0IsSUFBSSxFQUFFLENBQUMsS0FBTyxFQUFFLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0NBQzlCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge0FyZWEsIEFyZWFzfSBmcm9tICcuL2FyZWEuanMnO1xuaW1wb3J0IHtFbnRpdHl9IGZyb20gJy4vZW50aXR5LmpzJztcbmltcG9ydCB7U2NyZWVufSBmcm9tICcuL3NjcmVlbi5qcyc7XG5pbXBvcnQge0RhdGEsIERhdGFUdXBsZSxcbiAgICAgICAgY29uY2F0SXRlcmFibGVzLCBncm91cCwgaGV4LCBpbml0aWFsaXplcixcbiAgICAgICAgcmVhZExpdHRsZUVuZGlhbiwgc2VxLCB0dXBsZSwgdmFyU2xpY2UsXG4gICAgICAgIHdyaXRlTGl0dGxlRW5kaWFuLCB1cHBlckNhbWVsVG9TcGFjZXN9IGZyb20gJy4vdXRpbC5qcyc7XG5pbXBvcnQge1dyaXRlcn0gZnJvbSAnLi93cml0ZXIuanMnO1xuaW1wb3J0IHtSb219IGZyb20gJy4uL3JvbS5qcyc7XG5pbXBvcnQge1VuaW9uRmluZH0gZnJvbSAnLi4vdW5pb25maW5kLmpzJztcbmltcG9ydCB7YXNzZXJ0TmV2ZXIsIGl0ZXJzLCBEZWZhdWx0TWFwfSBmcm9tICcuLi91dGlsLmpzJztcbmltcG9ydCB7TW9uc3Rlcn0gZnJvbSAnLi9tb25zdGVyLmpzJztcbmltcG9ydCB7UmFuZG9tfSBmcm9tICcuLi9yYW5kb20uanMnO1xuXG4vLyBOdW1iZXIgaW5kaWNhdGVzIHRvIGNvcHkgd2hhdGV2ZXIncyBhdCB0aGUgZ2l2ZW4gZXhpdFxudHlwZSBLZXkgPSBzdHJpbmcgfCBzeW1ib2wgfCBudW1iZXI7XG4vLyBMb2NhbCBmb3IgZGVmaW5pbmcgbmFtZXMgb24gTG9jYXRpb25zIG9iamVjdHMuXG5pbnRlcmZhY2UgTG9jYXRpb25Jbml0IHtcbiAgYXJlYT86IChhcmVhczogQXJlYXMpID0+IEFyZWE7XG4gIHN1YkFyZWE/OiBzdHJpbmc7XG4gIG11c2ljPzogS2V5IHwgKChhcmVhOiBBcmVhKSA9PiBLZXkpO1xuICBwYWxldHRlPzogS2V5IHwgKChhcmVhOiBBcmVhKSA9PiBLZXkpO1xuICBib3NzU2NyZWVuPzogbnVtYmVyO1xufVxuaW50ZXJmYWNlIExvY2F0aW9uRGF0YSB7XG4gIGFyZWE6IEFyZWE7XG4gIG5hbWU6IHN0cmluZztcbiAgbXVzaWM6IEtleTtcbiAgcGFsZXR0ZTogS2V5O1xuICBzdWJBcmVhPzogc3RyaW5nO1xuICBib3NzU2NyZWVuPzogbnVtYmVyO1xufVxuXG5jb25zdCBDQVZFID0ge1xuICBzdWJBcmVhOiAnY2F2ZScsXG4gIG11c2ljOiAoYXJlYTogQXJlYSkgPT4gYCR7YXJlYS5uYW1lfS1DYXZlYCxcbiAgcGFsZXR0ZTogKGFyZWE6IEFyZWEpID0+IGAke2FyZWEubmFtZX0tQ2F2ZWAsXG59IGFzIGNvbnN0O1xuY29uc3QgSE9VU0UgPSB7XG4gIHN1YkFyZWE6ICdob3VzZScsXG4gIHBhbGV0dGU6ICgpID0+IFN5bWJvbCgpLFxufSBhcyBjb25zdDtcbmNvbnN0IEZPUlRVTkVfVEVMTEVSID0ge1xuICBzdWJBcmVhOiAnaG91c2UnLFxuICBwYWxldHRlOiAoKSA9PiBTeW1ib2woKSxcbiAgbXVzaWM6IChhcmVhOiBBcmVhKSA9PiBgJHthcmVhLm5hbWV9LUZvcnR1bmVUZWxsZXJgLFxufSBhcyBjb25zdDtcbmNvbnN0IE1FU0lBID0ge1xuICBuYW1lOiAnbWVzaWEnLFxuICBtdXNpYzogKGFyZWE6IEFyZWEpID0+IGAke2FyZWEubmFtZX0tTWVzaWFgLFxuICAvLyBNZXNpYSBpbiB0b3dlciBrZWVwcyBzYW1lIHBhbGV0dGVcbiAgcGFsZXR0ZTogKGFyZWE6IEFyZWEpID0+IGFyZWEubmFtZSA9PT0gJ1Rvd2VyJyA/XG4gICAgICBhcmVhLm5hbWUgOiBgJHthcmVhLm5hbWV9LU1lc2lhYCxcbn0gYXMgY29uc3Q7XG5jb25zdCBEWU5BID0ge1xuICBuYW1lOiAnZHluYScsXG4gIG11c2ljOiAoYXJlYTogQXJlYSkgPT4gYCR7YXJlYS5uYW1lfS1EeW5hYCxcbiAgcGFsZXR0ZTogKGFyZWE6IEFyZWEpID0+IGAke2FyZWEubmFtZX0tRHluYWAsXG59IGFzIGNvbnN0O1xuY29uc3QgS0VMQkVTUVVFID0ge1xuICBuYW1lOiAnZ29hIDEnLFxuICBtdXNpYzogJ2dvYSAxJyxcbiAgcGFsZXR0ZTogJ2dvYSAxJyxcbn0gYXMgY29uc3Q7XG5jb25zdCBTQUJFUkEgPSB7XG4gIG5hbWU6ICdnb2EgMicsXG4gIG11c2ljOiAnZ29hIDInLFxuICBwYWxldHRlOiAnZ29hIDInLFxufSBhcyBjb25zdDtcbmNvbnN0IE1BRE9fTE9XRVIgPSB7XG4gIG5hbWU6ICdnb2EgMycsXG4gIG11c2ljOiAnZ29hIDMnLFxuICBwYWxldHRlOiAnZ29hIDMnLFxufSBhcyBjb25zdDtcbmNvbnN0IE1BRE9fVVBQRVIgPSB7Li4uTUFET19MT1dFUiwgcGFsZXR0ZTogJ2dvYSAzIHVwcGVyJ30gYXMgY29uc3Q7XG5jb25zdCBLQVJNSU5FX1VQUEVSID0ge1xuICBuYW1lOiAnZ29hIDQnLFxuICBtdXNpYzogJ2dvYSA0JyxcbiAgcGFsZXR0ZTogJ2dvYSA0Jyxcbn0gYXMgY29uc3Q7XG5jb25zdCBLQVJNSU5FX0xPV0VSID0gey4uLktBUk1JTkVfVVBQRVIsIHBhbGV0dGU6ICdnb2EgNCBsb3dlcid9IGFzIGNvbnN0O1xuXG50eXBlIEluaXRQYXJhbXMgPSByZWFkb25seSBbbnVtYmVyLCBMb2NhdGlvbkluaXQ/XTtcbnR5cGUgSW5pdCA9IHsoLi4uYXJnczogSW5pdFBhcmFtcyk6IExvY2F0aW9uLFxuICAgICAgICAgICAgIGNvbW1pdChsb2NhdGlvbnM6IExvY2F0aW9ucyk6IHZvaWR9O1xuY29uc3QgJDogSW5pdCA9ICgoKSA9PiB7XG4gIGNvbnN0ICQgPSBpbml0aWFsaXplcjxbbnVtYmVyLCBMb2NhdGlvbkluaXRdLCBMb2NhdGlvbj4oKTtcbiAgbGV0IGFyZWEhOiAoYXJlYXM6IEFyZWFzKSA9PiBBcmVhO1xuICBmdW5jdGlvbiAkJChpZDogbnVtYmVyLCBkYXRhOiBMb2NhdGlvbkluaXQgPSB7fSk6IExvY2F0aW9uIHtcbiAgICBkYXRhID0gey4uLmRhdGF9O1xuICAgIGFyZWEgPSBkYXRhLmFyZWEgPSBkYXRhLmFyZWEgfHwgYXJlYTtcbiAgICByZXR1cm4gJChpZCwgZGF0YSk7XG4gIH07XG4gICgkJCBhcyBJbml0KS5jb21taXQgPSAobG9jYXRpb25zOiBMb2NhdGlvbnMpID0+IHtcbiAgICBjb25zdCBhcmVhcyA9IGxvY2F0aW9ucy5yb20uYXJlYXM7XG4gICAgJC5jb21taXQobG9jYXRpb25zLCAocHJvcDogc3RyaW5nLCBpZDogbnVtYmVyLCBpbml0OiBMb2NhdGlvbkluaXQpID0+IHtcbiAgICAgIGNvbnN0IG5hbWUgPSB1cHBlckNhbWVsVG9TcGFjZXMocHJvcCk7XG4gICAgICBjb25zdCBhcmVhID0gaW5pdC5hcmVhIShhcmVhcyk7XG4gICAgICBjb25zdCBtdXNpYyA9IHR5cGVvZiBpbml0Lm11c2ljID09PSAnZnVuY3Rpb24nID9cbiAgICAgICAgICBpbml0Lm11c2ljKGFyZWEpIDogaW5pdC5tdXNpYyAhPSBudWxsID9cbiAgICAgICAgICBpbml0Lm11c2ljIDogYXJlYS5uYW1lO1xuICAgICAgY29uc3QgcGFsZXR0ZSA9IHR5cGVvZiBpbml0LnBhbGV0dGUgPT09ICdmdW5jdGlvbicgP1xuICAgICAgICAgIGluaXQucGFsZXR0ZShhcmVhKSA6IGluaXQucGFsZXR0ZSB8fCBhcmVhLm5hbWU7XG4gICAgICBjb25zdCBkYXRhOiBMb2NhdGlvbkRhdGEgPSB7YXJlYSwgbmFtZSwgbXVzaWMsIHBhbGV0dGV9O1xuICAgICAgaWYgKGluaXQuc3ViQXJlYSAhPSBudWxsKSBkYXRhLnN1YkFyZWEgPSBpbml0LnN1YkFyZWE7XG4gICAgICBpZiAoaW5pdC5ib3NzU2NyZWVuICE9IG51bGwpIGRhdGEuYm9zc1NjcmVlbiA9IGluaXQuYm9zc1NjcmVlbjtcbiAgICAgIGNvbnN0IGxvY2F0aW9uID0gbmV3IExvY2F0aW9uKGxvY2F0aW9ucy5yb20sIGlkLCBkYXRhKTtcbiAgICAgIC8vIG5lZ2F0aXZlIGlkIGluZGljYXRlcyBpdCdzIG5vdCByZWdpc3RlcmVkLlxuICAgICAgaWYgKGlkID49IDApIGxvY2F0aW9uc1tpZF0gPSBsb2NhdGlvbjtcbiAgICAgIHJldHVybiBsb2NhdGlvbjtcbiAgICB9KTtcbiAgfTtcbiAgcmV0dXJuICQkIGFzIEluaXQ7XG59KSgpO1xuXG5leHBvcnQgY2xhc3MgTG9jYXRpb25zIGV4dGVuZHMgQXJyYXk8TG9jYXRpb24+IHtcblxuICByZWFkb25seSBNZXphbWVTaHJpbmUgICAgICAgICAgICAgPSAkKDB4MDAsIHthcmVhOiBhID0+IGEuTWV6YW1lfSk7XG4gIHJlYWRvbmx5IExlYWZfT3V0c2lkZVN0YXJ0ICAgICAgICA9ICQoMHgwMSwge211c2ljOiAxfSk7XG4gIHJlYWRvbmx5IExlYWYgICAgICAgICAgICAgICAgICAgICA9ICQoMHgwMiwge2FyZWE6IGEgPT4gYS5MZWFmfSk7XG4gIHJlYWRvbmx5IFZhbGxleU9mV2luZCAgICAgICAgICAgICA9ICQoMHgwMywge2FyZWE6IGEgPT4gYS5WYWxsZXlPZldpbmR9KTtcbiAgcmVhZG9ubHkgU2VhbGVkQ2F2ZTEgICAgICAgICAgICAgID0gJCgweDA0LCB7YXJlYTogYSA9PiBhLlNlYWxlZENhdmV9KTtcbiAgcmVhZG9ubHkgU2VhbGVkQ2F2ZTIgICAgICAgICAgICAgID0gJCgweDA1KTtcbiAgcmVhZG9ubHkgU2VhbGVkQ2F2ZTYgICAgICAgICAgICAgID0gJCgweDA2KTtcbiAgcmVhZG9ubHkgU2VhbGVkQ2F2ZTQgICAgICAgICAgICAgID0gJCgweDA3KTtcbiAgcmVhZG9ubHkgU2VhbGVkQ2F2ZTUgICAgICAgICAgICAgID0gJCgweDA4KTtcbiAgcmVhZG9ubHkgU2VhbGVkQ2F2ZTMgICAgICAgICAgICAgID0gJCgweDA5KTtcbiAgcmVhZG9ubHkgU2VhbGVkQ2F2ZTcgICAgICAgICAgICAgID0gJCgweDBhLCB7Ym9zc1NjcmVlbjogMHg5MX0pO1xuICAvLyBJTlZBTElEOiAweDBiXG4gIHJlYWRvbmx5IFNlYWxlZENhdmU4ICAgICAgICAgICAgICA9ICQoMHgwYyk7XG4gIC8vIElOVkFMSUQ6IDB4MGRcbiAgcmVhZG9ubHkgV2luZG1pbGxDYXZlICAgICAgICAgICAgID0gJCgweDBlLCB7YXJlYTogYSA9PiBhLldpbmRtaWxsQ2F2ZX0pO1xuICByZWFkb25seSBXaW5kbWlsbCAgICAgICAgICAgICAgICAgPSAkKDB4MGYsIHthcmVhOiBhID0+IGEuV2luZG1pbGwsIG11c2ljOiAwfSk7XG4gIHJlYWRvbmx5IFplYnVDYXZlICAgICAgICAgICAgICAgICA9ICQoMHgxMCwge2FyZWE6IGEgPT4gYS5aZWJ1Q2F2ZX0pO1xuICByZWFkb25seSBNdFNhYnJlV2VzdF9DYXZlMSAgICAgICAgPSAkKDB4MTEsIHthcmVhOiBhID0+IGEuTXRTYWJyZVdlc3QsIC4uLkNBVkV9KTtcbiAgLy8gSU5WQUxJRDogMHgxMlxuICAvLyBJTlZBTElEOiAweDEzXG4gIHJlYWRvbmx5IENvcmRlbFBsYWluV2VzdCAgICAgICAgICA9ICQoMHgxNCwge2FyZWE6IGEgPT4gYS5Db3JkZWxQbGFpbn0pO1xuICByZWFkb25seSBDb3JkZWxQbGFpbkVhc3QgICAgICAgICAgPSAkKDB4MTUpO1xuICAvLyBJTlZBTElEOiAweDE2IC0tIHVudXNlZCBjb3B5IG9mIDE4XG4gIC8vIElOVkFMSUQ6IDB4MTdcbiAgcmVhZG9ubHkgQnJ5bm1hZXIgICAgICAgICAgICAgICAgID0gJCgweDE4LCB7YXJlYTogYSA9PiBhLkJyeW5tYWVyfSk7XG4gIHJlYWRvbmx5IE91dHNpZGVTdG9tSG91c2UgICAgICAgICA9ICQoMHgxOSwge2FyZWE6IGEgPT4gYS5TdG9tSG91c2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG11c2ljOiAwfSk7XG4gIHJlYWRvbmx5IFN3YW1wICAgICAgICAgICAgICAgICAgICA9ICQoMHgxYSwge2FyZWE6IGEgPT4gYS5Td2FtcCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYm9zc1NjcmVlbjogMHg3Y30pO1xuICByZWFkb25seSBBbWF6b25lcyAgICAgICAgICAgICAgICAgPSAkKDB4MWIsIHthcmVhOiBhID0+IGEuQW1hem9uZXN9KTtcbiAgcmVhZG9ubHkgT2FrICAgICAgICAgICAgICAgICAgICAgID0gJCgweDFjLCB7YXJlYTogYSA9PiBhLk9ha30pO1xuICAvLyBJTlZBTElEOiAweDFkXG4gIHJlYWRvbmx5IFN0b21Ib3VzZSAgICAgICAgICAgICAgICA9ICQoMHgxZSwge2FyZWE6IGEgPT4gYS5TdG9tSG91c2V9KTtcbiAgLy8gSU5WQUxJRDogMHgxZlxuICByZWFkb25seSBNdFNhYnJlV2VzdF9Mb3dlciAgICAgICAgPSAkKDB4MjAsIHthcmVhOiBhID0+IGEuTXRTYWJyZVdlc3R9KTtcbiAgcmVhZG9ubHkgTXRTYWJyZVdlc3RfVXBwZXIgICAgICAgID0gJCgweDIxKTtcbiAgcmVhZG9ubHkgTXRTYWJyZVdlc3RfQ2F2ZTIgICAgICAgID0gJCgweDIyLCBDQVZFKTtcbiAgcmVhZG9ubHkgTXRTYWJyZVdlc3RfQ2F2ZTMgICAgICAgID0gJCgweDIzLCBDQVZFKTtcbiAgcmVhZG9ubHkgTXRTYWJyZVdlc3RfQ2F2ZTQgICAgICAgID0gJCgweDI0LCBDQVZFKTtcbiAgcmVhZG9ubHkgTXRTYWJyZVdlc3RfQ2F2ZTUgICAgICAgID0gJCgweDI1LCBDQVZFKTtcbiAgcmVhZG9ubHkgTXRTYWJyZVdlc3RfQ2F2ZTYgICAgICAgID0gJCgweDI2LCBDQVZFKTtcbiAgcmVhZG9ubHkgTXRTYWJyZVdlc3RfQ2F2ZTcgICAgICAgID0gJCgweDI3LCBDQVZFKTtcbiAgcmVhZG9ubHkgTXRTYWJyZU5vcnRoX01haW4gICAgICAgID0gJCgweDI4LCB7YXJlYTogYSA9PiBhLk10U2FicmVOb3J0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBib3NzU2NyZWVuOiAweGI1fSk7XG4gIHJlYWRvbmx5IE10U2FicmVOb3J0aF9NaWRkbGUgICAgICA9ICQoMHgyOSk7XG4gIHJlYWRvbmx5IE10U2FicmVOb3J0aF9DYXZlMiAgICAgICA9ICQoMHgyYSwgQ0FWRSk7XG4gIHJlYWRvbmx5IE10U2FicmVOb3J0aF9DYXZlMyAgICAgICA9ICQoMHgyYiwgQ0FWRSk7XG4gIHJlYWRvbmx5IE10U2FicmVOb3J0aF9DYXZlNCAgICAgICA9ICQoMHgyYywgQ0FWRSk7XG4gIHJlYWRvbmx5IE10U2FicmVOb3J0aF9DYXZlNSAgICAgICA9ICQoMHgyZCwgQ0FWRSk7XG4gIHJlYWRvbmx5IE10U2FicmVOb3J0aF9DYXZlNiAgICAgICA9ICQoMHgyZSwgQ0FWRSk7XG4gIHJlYWRvbmx5IE10U2FicmVOb3J0aF9Qcmlzb25IYWxsICA9ICQoMHgyZiwgQ0FWRSk7XG4gIHJlYWRvbmx5IE10U2FicmVOb3J0aF9MZWZ0Q2VsbCAgICA9ICQoMHgzMCwgQ0FWRSk7XG4gIHJlYWRvbmx5IE10U2FicmVOb3J0aF9MZWZ0Q2VsbDIgICA9ICQoMHgzMSwgQ0FWRSk7XG4gIHJlYWRvbmx5IE10U2FicmVOb3J0aF9SaWdodENlbGwgICA9ICQoMHgzMiwgQ0FWRSk7XG4gIHJlYWRvbmx5IE10U2FicmVOb3J0aF9DYXZlOCAgICAgICA9ICQoMHgzMywgQ0FWRSk7XG4gIHJlYWRvbmx5IE10U2FicmVOb3J0aF9DYXZlOSAgICAgICA9ICQoMHgzNCwgQ0FWRSk7XG4gIHJlYWRvbmx5IE10U2FicmVOb3J0aF9TdW1taXRDYXZlICA9ICQoMHgzNSwgQ0FWRSk7XG4gIC8vIElOVkFMSUQ6IDB4MzZcbiAgLy8gSU5WQUxJRDogMHgzN1xuICByZWFkb25seSBNdFNhYnJlTm9ydGhfQ2F2ZTEgICAgICAgPSAkKDB4MzgsIENBVkUpO1xuICByZWFkb25seSBNdFNhYnJlTm9ydGhfQ2F2ZTcgICAgICAgPSAkKDB4MzksIENBVkUpO1xuICAvLyBJTlZBTElEOiAweDNhXG4gIC8vIElOVkFMSUQ6IDB4M2JcbiAgcmVhZG9ubHkgTmFkYXJlX0lubiAgICAgICAgICAgICAgID0gJCgweDNjLCB7YXJlYTogYSA9PiBhLk5hZGFyZSwgLi4uSE9VU0V9KTtcbiAgcmVhZG9ubHkgTmFkYXJlX1Rvb2xTaG9wICAgICAgICAgID0gJCgweDNkLCBIT1VTRSk7XG4gIHJlYWRvbmx5IE5hZGFyZV9CYWNrUm9vbSAgICAgICAgICA9ICQoMHgzZSwgSE9VU0UpO1xuICAvLyBJTlZBTElEOiAweDNmXG4gIHJlYWRvbmx5IFdhdGVyZmFsbFZhbGxleU5vcnRoICAgICA9ICQoMHg0MCwge2FyZWE6IGEgPT4gYS5XYXRlcmZhbGxWYWxsZXl9KTtcbiAgcmVhZG9ubHkgV2F0ZXJmYWxsVmFsbGV5U291dGggICAgID0gJCgweDQxKTtcbiAgcmVhZG9ubHkgTGltZVRyZWVWYWxsZXkgICAgICAgICAgID0gJCgweDQyLCB7YXJlYTogYSA9PiBhLkxpbWVUcmVlVmFsbGV5LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtdXNpYzogMH0pO1xuICByZWFkb25seSBMaW1lVHJlZUxha2UgICAgICAgICAgICAgPSAkKDB4NDMsIHthcmVhOiBhID0+IGEuTGltZVRyZWVMYWtlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtdXNpYzogMH0pO1xuICByZWFkb25seSBLaXJpc2FQbGFudENhdmUxICAgICAgICAgPSAkKDB4NDQsIHthcmVhOiBhID0+IGEuS2lyaXNhUGxhbnRDYXZlfSk7XG4gIHJlYWRvbmx5IEtpcmlzYVBsYW50Q2F2ZTIgICAgICAgICA9ICQoMHg0NSk7XG4gIHJlYWRvbmx5IEtpcmlzYVBsYW50Q2F2ZTMgICAgICAgICA9ICQoMHg0Nik7XG4gIHJlYWRvbmx5IEtpcmlzYU1lYWRvdyAgICAgICAgICAgICA9ICQoMHg0Nywge2FyZWE6IGEgPT4gYS5LaXJpc2FNZWFkb3d9KTtcbiAgcmVhZG9ubHkgRm9nTGFtcENhdmUxICAgICAgICAgICAgID0gJCgweDQ4LCB7YXJlYTogYSA9PiBhLkZvZ0xhbXBDYXZlfSk7XG4gIHJlYWRvbmx5IEZvZ0xhbXBDYXZlMiAgICAgICAgICAgICA9ICQoMHg0OSk7XG4gIHJlYWRvbmx5IEZvZ0xhbXBDYXZlMyAgICAgICAgICAgICA9ICQoMHg0YSk7XG4gIHJlYWRvbmx5IEZvZ0xhbXBDYXZlRGVhZEVuZCAgICAgICA9ICQoMHg0Yik7XG4gIHJlYWRvbmx5IEZvZ0xhbXBDYXZlNCAgICAgICAgICAgICA9ICQoMHg0Yyk7XG4gIHJlYWRvbmx5IEZvZ0xhbXBDYXZlNSAgICAgICAgICAgICA9ICQoMHg0ZCk7XG4gIHJlYWRvbmx5IEZvZ0xhbXBDYXZlNiAgICAgICAgICAgICA9ICQoMHg0ZSk7XG4gIHJlYWRvbmx5IEZvZ0xhbXBDYXZlNyAgICAgICAgICAgICA9ICQoMHg0Zik7XG4gIHJlYWRvbmx5IFBvcnRvYSAgICAgICAgICAgICAgICAgICA9ICQoMHg1MCwge2FyZWE6IGEgPT4gYS5Qb3J0b2F9KTtcbiAgcmVhZG9ubHkgUG9ydG9hX0Zpc2hlcm1hbklzbGFuZCAgID0gJCgweDUxLCB7YXJlYTogYSA9PiBhLkZpc2hlcm1hbkhvdXNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtdXNpYzogMH0pO1xuICByZWFkb25seSBNZXNpYVNocmluZSAgICAgICAgICAgICAgPSAkKDB4NTIsIHthcmVhOiBhID0+IGEuTGltZVRyZWVMYWtlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuLi5NRVNJQX0pO1xuICAvLyBJTlZBTElEOiAweDUzXG4gIHJlYWRvbmx5IFdhdGVyZmFsbENhdmUxICAgICAgICAgICA9ICQoMHg1NCwge2FyZWE6IGEgPT4gYS5XYXRlcmZhbGxDYXZlfSk7XG4gIHJlYWRvbmx5IFdhdGVyZmFsbENhdmUyICAgICAgICAgICA9ICQoMHg1NSk7XG4gIHJlYWRvbmx5IFdhdGVyZmFsbENhdmUzICAgICAgICAgICA9ICQoMHg1Nik7XG4gIHJlYWRvbmx5IFdhdGVyZmFsbENhdmU0ICAgICAgICAgICA9ICQoMHg1Nyk7XG4gIHJlYWRvbmx5IFRvd2VyRW50cmFuY2UgICAgICAgICAgICA9ICQoMHg1OCwge2FyZWE6IGEgPT4gYS5Ub3dlcn0pO1xuICByZWFkb25seSBUb3dlcjEgICAgICAgICAgICAgICAgICAgPSAkKDB4NTkpO1xuICByZWFkb25seSBUb3dlcjIgICAgICAgICAgICAgICAgICAgPSAkKDB4NWEpO1xuICByZWFkb25seSBUb3dlcjMgICAgICAgICAgICAgICAgICAgPSAkKDB4NWIpO1xuICByZWFkb25seSBUb3dlck91dHNpZGVNZXNpYSAgICAgICAgPSAkKDB4NWMpO1xuICByZWFkb25seSBUb3dlck91dHNpZGVEeW5hICAgICAgICAgPSAkKDB4NWQpO1xuICByZWFkb25seSBUb3dlck1lc2lhICAgICAgICAgICAgICAgPSAkKDB4NWUsIE1FU0lBKTtcbiAgcmVhZG9ubHkgVG93ZXJEeW5hICAgICAgICAgICAgICAgID0gJCgweDVmLCBEWU5BKTtcbiAgcmVhZG9ubHkgQW5ncnlTZWEgICAgICAgICAgICAgICAgID0gJCgweDYwLCB7YXJlYTogYSA9PiBhLkFuZ3J5U2VhfSk7XG4gIHJlYWRvbmx5IEJvYXRIb3VzZSAgICAgICAgICAgICAgICA9ICQoMHg2MSk7XG4gIHJlYWRvbmx5IEpvZWxMaWdodGhvdXNlICAgICAgICAgICA9ICQoMHg2Miwge2FyZWE6IGEgPT4gYS5MaWdodGhvdXNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtdXNpYzogMH0pO1xuICAvLyBJTlZBTElEOiAweDYzXG4gIHJlYWRvbmx5IFVuZGVyZ3JvdW5kQ2hhbm5lbCAgICAgICA9ICQoMHg2NCwge2FyZWE6IGEgPT4gYS5VbmRlcmdyb3VuZENoYW5uZWx9KTtcbiAgcmVhZG9ubHkgWm9tYmllVG93biAgICAgICAgICAgICAgID0gJCgweDY1LCB7YXJlYTogYSA9PiBhLlpvbWJpZVRvd259KTtcbiAgLy8gSU5WQUxJRDogMHg2NlxuICAvLyBJTlZBTElEOiAweDY3XG4gIHJlYWRvbmx5IEV2aWxTcGlyaXRJc2xhbmQxICAgICAgICA9ICQoMHg2OCwge2FyZWE6IGEgPT4gYS5FdmlsU3Bpcml0SXNsYW5kRW50cmFuY2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG11c2ljOiAxfSk7XG4gIHJlYWRvbmx5IEV2aWxTcGlyaXRJc2xhbmQyICAgICAgICA9ICQoMHg2OSwge2FyZWE6IGEgPT4gYS5FdmlsU3Bpcml0SXNsYW5kfSk7XG4gIHJlYWRvbmx5IEV2aWxTcGlyaXRJc2xhbmQzICAgICAgICA9ICQoMHg2YSk7XG4gIHJlYWRvbmx5IEV2aWxTcGlyaXRJc2xhbmQ0ICAgICAgICA9ICQoMHg2Yik7XG4gIHJlYWRvbmx5IFNhYmVyYVBhbGFjZTEgICAgICAgICAgICA9ICQoMHg2Yywge2FyZWE6IGEgPT4gYS5TYWJlcmFGb3J0cmVzcyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYm9zc1NjcmVlbjogMHhmZH0pO1xuICByZWFkb25seSBTYWJlcmFQYWxhY2UyICAgICAgICAgICAgPSAkKDB4NmQpO1xuICByZWFkb25seSBTYWJlcmFQYWxhY2UzICAgICAgICAgICAgPSAkKDB4NmUsIHtib3NzU2NyZWVuOiAweGZkfSk7XG4gIC8vIElOVkFMSUQ6IDB4NmYgLS0gU2FiZXJhIFBhbGFjZSAzIHVudXNlZCBjb3B5XG4gIHJlYWRvbmx5IEpvZWxTZWNyZXRQYXNzYWdlICAgICAgICA9ICQoMHg3MCwge2FyZWE6IGEgPT4gYS5Kb2VsUGFzc2FnZX0pO1xuICByZWFkb25seSBKb2VsICAgICAgICAgICAgICAgICAgICAgPSAkKDB4NzEsIHthcmVhOiBhID0+IGEuSm9lbH0pO1xuICByZWFkb25seSBTd2FuICAgICAgICAgICAgICAgICAgICAgPSAkKDB4NzIsIHthcmVhOiBhID0+IGEuU3dhbiwgbXVzaWM6IDF9KTtcbiAgcmVhZG9ubHkgU3dhbkdhdGUgICAgICAgICAgICAgICAgID0gJCgweDczLCB7YXJlYTogYSA9PiBhLlN3YW5HYXRlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtdXNpYzogMX0pO1xuICAvLyBJTlZBTElEOiAweDc0XG4gIC8vIElOVkFMSUQ6IDB4NzVcbiAgLy8gSU5WQUxJRDogMHg3NlxuICAvLyBJTlZBTElEOiAweDc3XG4gIHJlYWRvbmx5IEdvYVZhbGxleSAgICAgICAgICAgICAgICA9ICQoMHg3OCwge2FyZWE6IGEgPT4gYS5Hb2FWYWxsZXl9KTtcbiAgLy8gSU5WQUxJRDogMHg3OVxuICAvLyBJTlZBTElEOiAweDdhXG4gIC8vIElOVkFMSUQ6IDB4N2JcbiAgcmVhZG9ubHkgTXRIeWRyYSAgICAgICAgICAgICAgICAgID0gJCgweDdjLCB7YXJlYTogYSA9PiBhLk10SHlkcmF9KTtcbiAgcmVhZG9ubHkgTXRIeWRyYV9DYXZlMSAgICAgICAgICAgID0gJCgweDdkLCBDQVZFKTtcbiAgcmVhZG9ubHkgTXRIeWRyYV9PdXRzaWRlU2h5cm9uICAgID0gJCgweDdlKTtcbiAgcmVhZG9ubHkgTXRIeWRyYV9DYXZlMiAgICAgICAgICAgID0gJCgweDdmLCBDQVZFKTtcbiAgcmVhZG9ubHkgTXRIeWRyYV9DYXZlMyAgICAgICAgICAgID0gJCgweDgwLCBDQVZFKTtcbiAgcmVhZG9ubHkgTXRIeWRyYV9DYXZlNCAgICAgICAgICAgID0gJCgweDgxLCBDQVZFKTtcbiAgcmVhZG9ubHkgTXRIeWRyYV9DYXZlNSAgICAgICAgICAgID0gJCgweDgyLCBDQVZFKTtcbiAgcmVhZG9ubHkgTXRIeWRyYV9DYXZlNiAgICAgICAgICAgID0gJCgweDgzLCBDQVZFKTtcbiAgcmVhZG9ubHkgTXRIeWRyYV9DYXZlNyAgICAgICAgICAgID0gJCgweDg0LCBDQVZFKTtcbiAgcmVhZG9ubHkgTXRIeWRyYV9DYXZlOCAgICAgICAgICAgID0gJCgweDg1LCBDQVZFKTtcbiAgcmVhZG9ubHkgTXRIeWRyYV9DYXZlOSAgICAgICAgICAgID0gJCgweDg2LCBDQVZFKTtcbiAgcmVhZG9ubHkgTXRIeWRyYV9DYXZlMTAgICAgICAgICAgID0gJCgweDg3LCBDQVZFKTtcbiAgcmVhZG9ubHkgU3R5eDEgICAgICAgICAgICAgICAgICAgID0gJCgweDg4LCB7YXJlYTogYSA9PiBhLlN0eXh9KTtcbiAgcmVhZG9ubHkgU3R5eDIgICAgICAgICAgICAgICAgICAgID0gJCgweDg5KTtcbiAgcmVhZG9ubHkgU3R5eDMgICAgICAgICAgICAgICAgICAgID0gJCgweDhhKTtcbiAgLy8gSU5WQUxJRDogMHg4YlxuICByZWFkb25seSBTaHlyb24gICAgICAgICAgICAgICAgICAgPSAkKDB4OGMsIHthcmVhOiBhID0+IGEuU2h5cm9ufSk7XG4gIC8vIElOVkFMSUQ6IDB4OGRcbiAgcmVhZG9ubHkgR29hICAgICAgICAgICAgICAgICAgICAgID0gJCgweDhlLCB7YXJlYTogYSA9PiBhLkdvYX0pO1xuICByZWFkb25seSBHb2FGb3J0cmVzc0Jhc2VtZW50ICAgICAgPSAkKDB4OGYsIHthcmVhOiBhID0+IGEuRm9ydHJlc3NCYXNlbWVudCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbXVzaWM6IDB9KTtcbiAgcmVhZG9ubHkgRGVzZXJ0MSAgICAgICAgICAgICAgICAgID0gJCgweDkwLCB7YXJlYTogYSA9PiBhLkRlc2VydDF9KTtcbiAgcmVhZG9ubHkgT2FzaXNDYXZlTWFpbiAgICAgICAgICAgID0gJCgweDkxLCB7YXJlYTogYSA9PiBhLk9hc2lzQ2F2ZX0pO1xuICByZWFkb25seSBEZXNlcnRDYXZlMSAgICAgICAgICAgICAgPSAkKDB4OTIsIHthcmVhOiBhID0+IGEuRGVzZXJ0Q2F2ZTEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG11c2ljOiAwfSk7XG4gIHJlYWRvbmx5IFNhaGFyYSAgICAgICAgICAgICAgICAgICA9ICQoMHg5Mywge2FyZWE6IGEgPT4gYS5TYWhhcmF9KTtcbiAgcmVhZG9ubHkgU2FoYXJhT3V0c2lkZUNhdmUgICAgICAgID0gJCgweDk0LCB7bXVzaWM6IDB9KTsgLy8gVE9ETyAtIHNhaGFyYT8/IGdlbmVyaWM/P1xuICByZWFkb25seSBEZXNlcnRDYXZlMiAgICAgICAgICAgICAgPSAkKDB4OTUsIHthcmVhOiBhID0+IGEuRGVzZXJ0Q2F2ZTIsIG11c2ljOiAxfSk7XG4gIHJlYWRvbmx5IFNhaGFyYU1lYWRvdyAgICAgICAgICAgICA9ICQoMHg5Niwge2FyZWE6IGEgPT4gYS5TYWhhcmFNZWFkb3csIG11c2ljOiAwfSk7XG4gIC8vIElOVkFMSUQ6IDB4OTdcbiAgcmVhZG9ubHkgRGVzZXJ0MiAgICAgICAgICAgICAgICAgID0gJCgweDk4LCB7YXJlYTogYSA9PiBhLkRlc2VydDJ9KTtcbiAgLy8gSU5WQUxJRDogMHg5OVxuICAvLyBJTlZBTElEOiAweDlhXG4gIC8vIElOVkFMSUQ6IDB4OWJcbiAgcmVhZG9ubHkgUHlyYW1pZF9FbnRyYW5jZSAgICAgICAgID0gJCgweDljLCB7YXJlYTogYSA9PiBhLlB5cmFtaWR9KTtcbiAgcmVhZG9ubHkgUHlyYW1pZF9CcmFuY2ggICAgICAgICAgID0gJCgweDlkKTtcbiAgcmVhZG9ubHkgUHlyYW1pZF9NYWluICAgICAgICAgICAgID0gJCgweDllKTtcbiAgcmVhZG9ubHkgUHlyYW1pZF9EcmF5Z29uICAgICAgICAgID0gJCgweDlmKTtcbiAgcmVhZG9ubHkgQ3J5cHRfRW50cmFuY2UgICAgICAgICAgID0gJCgweGEwLCB7YXJlYTogYSA9PiBhLkNyeXB0fSk7XG4gIHJlYWRvbmx5IENyeXB0X0hhbGwxICAgICAgICAgICAgICA9ICQoMHhhMSk7XG4gIHJlYWRvbmx5IENyeXB0X0JyYW5jaCAgICAgICAgICAgICA9ICQoMHhhMik7XG4gIHJlYWRvbmx5IENyeXB0X0RlYWRFbmRMZWZ0ICAgICAgICA9ICQoMHhhMyk7XG4gIHJlYWRvbmx5IENyeXB0X0RlYWRFbmRSaWdodCAgICAgICA9ICQoMHhhNCk7XG4gIHJlYWRvbmx5IENyeXB0X0hhbGwyICAgICAgICAgICAgICA9ICQoMHhhNSk7XG4gIHJlYWRvbmx5IENyeXB0X0RyYXlnb24yICAgICAgICAgICA9ICQoMHhhNik7XG4gIHJlYWRvbmx5IENyeXB0X1RlbGVwb3J0ZXIgICAgICAgICA9ICQoMHhhNywge211c2ljOiAnQ3J5cHQtVGVsZXBvcnRlcid9KTtcbiAgcmVhZG9ubHkgR29hRm9ydHJlc3NfRW50cmFuY2UgICAgID0gJCgweGE4LCB7YXJlYTogYSA9PiBhLkdvYUZvcnRyZXNzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtdXNpYzogS0VMQkVTUVVFLm11c2ljfSk7XG4gIHJlYWRvbmx5IEdvYUZvcnRyZXNzX0tlbGJlc3F1ZSAgICA9ICQoMHhhOSwge2Jvc3NTY3JlZW46IDB4NzMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC4uLktFTEJFU1FVRX0pO1xuICByZWFkb25seSBHb2FGb3J0cmVzc19aZWJ1ICAgICAgICAgPSAkKDB4YWEsIHsuLi5LRUxCRVNRVUUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhbGV0dGU6IFNBQkVSQS5wYWxldHRlfSk7XG4gIHJlYWRvbmx5IEdvYUZvcnRyZXNzX1NhYmVyYSAgICAgICA9ICQoMHhhYiwgU0FCRVJBKTtcbiAgcmVhZG9ubHkgR29hRm9ydHJlc3NfVG9ybmVsICAgICAgID0gJCgweGFjLCB7Ym9zc1NjcmVlbjogMHg5MSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLi4uU0FCRVJBLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYWxldHRlOiBNQURPX0xPV0VSLnBhbGV0dGV9KTtcbiAgcmVhZG9ubHkgR29hRm9ydHJlc3NfTWFkbzEgICAgICAgID0gJCgweGFkLCBNQURPX0xPV0VSKTtcbiAgcmVhZG9ubHkgR29hRm9ydHJlc3NfTWFkbzIgICAgICAgID0gJCgweGFlLCBNQURPX1VQUEVSKTtcbiAgcmVhZG9ubHkgR29hRm9ydHJlc3NfTWFkbzMgICAgICAgID0gJCgweGFmLCBNQURPX1VQUEVSKTtcbiAgcmVhZG9ubHkgR29hRm9ydHJlc3NfS2FybWluZTEgICAgID0gJCgweGIwLCBLQVJNSU5FX1VQUEVSKTtcbiAgcmVhZG9ubHkgR29hRm9ydHJlc3NfS2FybWluZTIgICAgID0gJCgweGIxLCBLQVJNSU5FX1VQUEVSKTtcbiAgcmVhZG9ubHkgR29hRm9ydHJlc3NfS2FybWluZTMgICAgID0gJCgweGIyLCBLQVJNSU5FX1VQUEVSKTtcbiAgcmVhZG9ubHkgR29hRm9ydHJlc3NfS2FybWluZTQgICAgID0gJCgweGIzLCBLQVJNSU5FX1VQUEVSKTtcbiAgcmVhZG9ubHkgR29hRm9ydHJlc3NfS2FybWluZTUgICAgID0gJCgweGI0LCBLQVJNSU5FX1VQUEVSKTtcbiAgcmVhZG9ubHkgR29hRm9ydHJlc3NfS2FybWluZTYgICAgID0gJCgweGI1LCBLQVJNSU5FX0xPV0VSKTtcbiAgcmVhZG9ubHkgR29hRm9ydHJlc3NfS2FybWluZTcgICAgID0gJCgweGI2LCB7Ym9zc1NjcmVlbjogMHhmZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLi4uS0FSTUlORV9MT1dFUn0pO1xuICByZWFkb25seSBHb2FGb3J0cmVzc19FeGl0ICAgICAgICAgPSAkKDB4YjcsIHttdXNpYzogS0FSTUlORV9VUFBFUi5tdXNpY30pO1xuICByZWFkb25seSBPYXNpc0NhdmVfRW50cmFuY2UgICAgICAgPSAkKDB4YjgsIHthcmVhOiBhID0+IGEuT2FzaXNFbnRyYW5jZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbXVzaWM6IDJ9KTtcbiAgcmVhZG9ubHkgR29hRm9ydHJlc3NfQXNpbmEgICAgICAgID0gJCgweGI5LCB7YXJlYTogYSA9PiBhLkdvYUZvcnRyZXNzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuLi5NQURPX1VQUEVSLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBib3NzU2NyZWVuOiAweDkxfSk7XG4gIHJlYWRvbmx5IEdvYUZvcnRyZXNzX0tlbnN1ICAgICAgICA9ICQoMHhiYSwgS0FSTUlORV9VUFBFUik7XG4gIHJlYWRvbmx5IEdvYV9Ib3VzZSAgICAgICAgICAgICAgICA9ICQoMHhiYiwge2FyZWE6IGEgPT4gYS5Hb2EsIC4uLkhPVVNFfSk7XG4gIHJlYWRvbmx5IEdvYV9Jbm4gICAgICAgICAgICAgICAgICA9ICQoMHhiYywgSE9VU0UpO1xuICAvLyBJTlZBTElEOiAweGJkXG4gIHJlYWRvbmx5IEdvYV9Ub29sU2hvcCAgICAgICAgICAgICA9ICQoMHhiZSwgSE9VU0UpO1xuICByZWFkb25seSBHb2FfVGF2ZXJuICAgICAgICAgICAgICAgPSAkKDB4YmYsIEhPVVNFKTtcbiAgcmVhZG9ubHkgTGVhZl9FbGRlckhvdXNlICAgICAgICAgID0gJCgweGMwLCB7YXJlYTogYSA9PiBhLkxlYWYsIC4uLkhPVVNFfSk7XG4gIHJlYWRvbmx5IExlYWZfUmFiYml0SHV0ICAgICAgICAgICA9ICQoMHhjMSwgSE9VU0UpO1xuICByZWFkb25seSBMZWFmX0lubiAgICAgICAgICAgICAgICAgPSAkKDB4YzIsIEhPVVNFKTtcbiAgcmVhZG9ubHkgTGVhZl9Ub29sU2hvcCAgICAgICAgICAgID0gJCgweGMzLCBIT1VTRSk7XG4gIHJlYWRvbmx5IExlYWZfQXJtb3JTaG9wICAgICAgICAgICA9ICQoMHhjNCwgSE9VU0UpO1xuICByZWFkb25seSBMZWFmX1N0dWRlbnRIb3VzZSAgICAgICAgPSAkKDB4YzUsIEhPVVNFKTtcbiAgcmVhZG9ubHkgQnJ5bm1hZXJfVGF2ZXJuICAgICAgICAgID0gJCgweGM2LCB7YXJlYTogYSA9PiBhLkJyeW5tYWVyLCAuLi5IT1VTRX0pO1xuICByZWFkb25seSBCcnlubWFlcl9QYXduU2hvcCAgICAgICAgPSAkKDB4YzcsIEhPVVNFKTtcbiAgcmVhZG9ubHkgQnJ5bm1hZXJfSW5uICAgICAgICAgICAgID0gJCgweGM4LCBIT1VTRSk7XG4gIHJlYWRvbmx5IEJyeW5tYWVyX0FybW9yU2hvcCAgICAgICA9ICQoMHhjOSwgSE9VU0UpO1xuICAvLyBJTlZBTElEOiAweGNhXG4gIHJlYWRvbmx5IEJyeW5tYWVyX0l0ZW1TaG9wICAgICAgICA9ICQoMHhjYiwgSE9VU0UpO1xuICAvLyBJTlZBTElEOiAweGNjXG4gIHJlYWRvbmx5IE9ha19FbGRlckhvdXNlICAgICAgICAgICA9ICQoMHhjZCwge2FyZWE6IGEgPT4gYS5PYWssIC4uLkhPVVNFfSk7XG4gIHJlYWRvbmx5IE9ha19Nb3RoZXJIb3VzZSAgICAgICAgICA9ICQoMHhjZSwgSE9VU0UpO1xuICByZWFkb25seSBPYWtfVG9vbFNob3AgICAgICAgICAgICAgPSAkKDB4Y2YsIEhPVVNFKTtcbiAgcmVhZG9ubHkgT2FrX0lubiAgICAgICAgICAgICAgICAgID0gJCgweGQwLCBIT1VTRSk7XG4gIHJlYWRvbmx5IEFtYXpvbmVzX0lubiAgICAgICAgICAgICA9ICQoMHhkMSwge2FyZWE6IGEgPT4gYS5BbWF6b25lcywgLi4uSE9VU0V9KTtcbiAgcmVhZG9ubHkgQW1hem9uZXNfSXRlbVNob3AgICAgICAgID0gJCgweGQyLCBIT1VTRSk7XG4gIHJlYWRvbmx5IEFtYXpvbmVzX0FybW9yU2hvcCAgICAgICA9ICQoMHhkMywgSE9VU0UpO1xuICByZWFkb25seSBBbWF6b25lc19FbGRlciAgICAgICAgICAgPSAkKDB4ZDQsIEhPVVNFKTtcbiAgcmVhZG9ubHkgTmFkYXJlICAgICAgICAgICAgICAgICAgID0gJCgweGQ1LCB7YXJlYTogYSA9PiBhLk5hZGFyZX0pOyAvLyBlZGdlLWRvb3I/XG4gIHJlYWRvbmx5IFBvcnRvYV9GaXNoZXJtYW5Ib3VzZSAgICA9ICQoMHhkNiwge2FyZWE6IGEgPT4gYS5GaXNoZXJtYW5Ib3VzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLi4uSE9VU0UsIG11c2ljOiAwfSk7XG4gIHJlYWRvbmx5IFBvcnRvYV9QYWxhY2VFbnRyYW5jZSAgICA9ICQoMHhkNywge2FyZWE6IGEgPT4gYS5Qb3J0b2FQYWxhY2V9KTtcbiAgcmVhZG9ubHkgUG9ydG9hX0ZvcnR1bmVUZWxsZXIgICAgID0gJCgweGQ4LCB7YXJlYTogYSA9PiBhLlBvcnRvYSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLi4uRk9SVFVORV9URUxMRVJ9KTtcbiAgcmVhZG9ubHkgUG9ydG9hX1Bhd25TaG9wICAgICAgICAgID0gJCgweGQ5LCBIT1VTRSk7XG4gIHJlYWRvbmx5IFBvcnRvYV9Bcm1vclNob3AgICAgICAgICA9ICQoMHhkYSwgSE9VU0UpO1xuICAvLyBJTlZBTElEOiAweGRiXG4gIHJlYWRvbmx5IFBvcnRvYV9Jbm4gICAgICAgICAgICAgICA9ICQoMHhkYywgSE9VU0UpO1xuICByZWFkb25seSBQb3J0b2FfVG9vbFNob3AgICAgICAgICAgPSAkKDB4ZGQsIEhPVVNFKTtcbiAgcmVhZG9ubHkgUG9ydG9hUGFsYWNlX0xlZnQgICAgICAgID0gJCgweGRlLCB7YXJlYTogYSA9PiBhLlBvcnRvYVBhbGFjZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLi4uSE9VU0V9KTtcbiAgcmVhZG9ubHkgUG9ydG9hUGFsYWNlX1Rocm9uZVJvb20gID0gJCgweGRmLCBIT1VTRSk7XG4gIHJlYWRvbmx5IFBvcnRvYVBhbGFjZV9SaWdodCAgICAgICA9ICQoMHhlMCwgSE9VU0UpO1xuICByZWFkb25seSBQb3J0b2FfQXNpbmFSb29tICAgICAgICAgPSAkKDB4ZTEsIHthcmVhOiBhID0+IGEuVW5kZXJncm91bmRDaGFubmVsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuLi5IT1VTRSwgbXVzaWM6ICdhc2luYSd9KTtcbiAgcmVhZG9ubHkgQW1hem9uZXNfRWxkZXJEb3duc3RhaXJzID0gJCgweGUyLCB7YXJlYTogYSA9PiBhLkFtYXpvbmVzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuLi5IT1VTRX0pO1xuICByZWFkb25seSBKb2VsX0VsZGVySG91c2UgICAgICAgICAgPSAkKDB4ZTMsIHthcmVhOiBhID0+IGEuSm9lbCwgLi4uSE9VU0V9KTtcbiAgcmVhZG9ubHkgSm9lbF9TaGVkICAgICAgICAgICAgICAgID0gJCgweGU0LCBIT1VTRSk7XG4gIHJlYWRvbmx5IEpvZWxfVG9vbFNob3AgICAgICAgICAgICA9ICQoMHhlNSwgSE9VU0UpO1xuICAvLyBJTlZBTElEOiAweGU2XG4gIHJlYWRvbmx5IEpvZWxfSW5uICAgICAgICAgICAgICAgICA9ICQoMHhlNywgSE9VU0UpO1xuICByZWFkb25seSBab21iaWVUb3duX0hvdXNlICAgICAgICAgPSAkKDB4ZTgsIHthcmVhOiBhID0+IGEuWm9tYmllVG93bixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLi4uSE9VU0V9KTtcbiAgcmVhZG9ubHkgWm9tYmllVG93bl9Ib3VzZUJhc2VtZW50ID0gJCgweGU5LCBIT1VTRSk7XG4gIC8vIElOVkFMSUQ6IDB4ZWFcbiAgcmVhZG9ubHkgU3dhbl9Ub29sU2hvcCAgICAgICAgICAgID0gJCgweGViLCB7YXJlYTogYSA9PiBhLlN3YW4sIC4uLkhPVVNFfSk7XG4gIHJlYWRvbmx5IFN3YW5fU3RvbUh1dCAgICAgICAgICAgICA9ICQoMHhlYywgSE9VU0UpO1xuICByZWFkb25seSBTd2FuX0lubiAgICAgICAgICAgICAgICAgPSAkKDB4ZWQsIEhPVVNFKTtcbiAgcmVhZG9ubHkgU3dhbl9Bcm1vclNob3AgICAgICAgICAgID0gJCgweGVlLCBIT1VTRSk7XG4gIHJlYWRvbmx5IFN3YW5fVGF2ZXJuICAgICAgICAgICAgICA9ICQoMHhlZiwgSE9VU0UpO1xuICByZWFkb25seSBTd2FuX1Bhd25TaG9wICAgICAgICAgICAgPSAkKDB4ZjAsIEhPVVNFKTtcbiAgcmVhZG9ubHkgU3dhbl9EYW5jZUhhbGwgICAgICAgICAgID0gJCgweGYxLCBIT1VTRSk7XG4gIHJlYWRvbmx5IFNoeXJvbl9UZW1wbGUgICAgICAgICAgICA9ICQoMHhmMiwge2FyZWE6IGEgPT4gYS5TaHlyb25UZW1wbGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJvc3NTY3JlZW46IDB4NzB9KTtcbiAgcmVhZG9ubHkgU2h5cm9uX1RyYWluaW5nSGFsbCAgICAgID0gJCgweGYzLCB7YXJlYTogYSA9PiBhLlNoeXJvbiwgLi4uSE9VU0V9KTtcbiAgcmVhZG9ubHkgU2h5cm9uX0hvc3BpdGFsICAgICAgICAgID0gJCgweGY0LCBIT1VTRSk7XG4gIHJlYWRvbmx5IFNoeXJvbl9Bcm1vclNob3AgICAgICAgICA9ICQoMHhmNSwgSE9VU0UpO1xuICByZWFkb25seSBTaHlyb25fVG9vbFNob3AgICAgICAgICAgPSAkKDB4ZjYsIEhPVVNFKTtcbiAgcmVhZG9ubHkgU2h5cm9uX0lubiAgICAgICAgICAgICAgID0gJCgweGY3LCBIT1VTRSk7XG4gIHJlYWRvbmx5IFNhaGFyYV9Jbm4gICAgICAgICAgICAgICA9ICQoMHhmOCwge2FyZWE6IGEgPT4gYS5TYWhhcmEsIC4uLkhPVVNFfSk7XG4gIHJlYWRvbmx5IFNhaGFyYV9Ub29sU2hvcCAgICAgICAgICA9ICQoMHhmOSwgSE9VU0UpO1xuICByZWFkb25seSBTYWhhcmFfRWxkZXJIb3VzZSAgICAgICAgPSAkKDB4ZmEsIEhPVVNFKTtcbiAgcmVhZG9ubHkgU2FoYXJhX1Bhd25TaG9wICAgICAgICAgID0gJCgweGZiLCBIT1VTRSk7XG5cbiAgLy8gTmV3IGxvY2F0aW9ucywgbm8gSUQgcHJvY3VyZWQgeWV0LlxuICByZWFkb25seSBFYXN0Q2F2ZTEgICAgICA9ICQoLTEsIHthcmVhOiBhID0+IGEuRWFzdENhdmV9KTtcbiAgcmVhZG9ubHkgRWFzdENhdmUyICAgICAgPSAkKC0xKTtcbiAgcmVhZG9ubHkgRmlzaGVybWFuQmVhY2ggPSAkKC0xLCB7YXJlYTogYSA9PiBhLkZpc2hlcm1hbkhvdXNlLCAuLi5IT1VTRX0pO1xuXG4gIGNvbnN0cnVjdG9yKHJlYWRvbmx5IHJvbTogUm9tKSB7XG4gICAgc3VwZXIoMHgxMDApO1xuICAgICQuY29tbWl0KHRoaXMpO1xuICAgIC8vIEZpbGwgaW4gYW55IG1pc3Npbmcgb25lc1xuICAgIGZvciAobGV0IGlkID0gMDsgaWQgPCAweDEwMDsgaWQrKykge1xuICAgICAgaWYgKHRoaXNbaWRdKSBjb250aW51ZTtcbiAgICAgIHRoaXNbaWRdID0gbmV3IExvY2F0aW9uKHJvbSwgaWQsIHtcbiAgICAgICAgYXJlYTogcm9tLmFyZWFzLkVtcHR5LFxuICAgICAgICBuYW1lOiAnJyxcbiAgICAgICAgbXVzaWM6ICcnLFxuICAgICAgICBwYWxldHRlOiAnJyxcbiAgICAgIH0pO1xuICAgIH1cbiAgICAvLyBUT0RPIC0gbWV0aG9kIHRvIGFkZCBhbiB1bnJlZ2lzdGVyZWQgbG9jYXRpb24gdG8gYW4gZW1wdHkgaW5kZXguXG4gIH1cblxuICBhbGxvY2F0ZShsb2NhdGlvbjogTG9jYXRpb24pOiBMb2NhdGlvbiB7XG4gICAgLy8gcGljayBhbiB1bnVzZWQgbG9jYXRpb25cbiAgICBmb3IgKGNvbnN0IGwgb2YgdGhpcykge1xuICAgICAgaWYgKGwudXNlZCkgY29udGludWU7XG4gICAgICAobG9jYXRpb24gYXMgYW55KS5pZCA9IGwuaWQ7XG4gICAgICBsb2NhdGlvbi51c2VkID0gdHJ1ZTtcbiAgICAgIHJldHVybiB0aGlzW2wuaWRdID0gbG9jYXRpb247XG4gICAgfVxuICAgIHRocm93IG5ldyBFcnJvcignTm8gdW51c2VkIGxvY2F0aW9uJyk7XG4gIH1cblxuICAvLyAvLyBGaW5kIGFsbCBncm91cHMgb2YgbmVpZ2hib3JpbmcgbG9jYXRpb25zIHdpdGggbWF0Y2hpbmcgcHJvcGVydGllcy5cbiAgLy8gLy8gVE9ETyAtIG9wdGlvbmFsIGFyZzogY2hlY2sgYWRqYWNlbnQgIyBJRHMuLi4/XG4gIC8vIHBhcnRpdGlvbjxUPihmdW5jOiAobG9jOiBMb2NhdGlvbikgPT4gVCwgZXE6IEVxPFQ+ID0gKGEsIGIpID0+IGEgPT09IGIsIGpvaW5OZXh1c2VzID0gZmFsc2UpOiBbTG9jYXRpb25bXSwgVF1bXSB7XG4gIC8vICAgY29uc3Qgc2VlbiA9IG5ldyBTZXQ8TG9jYXRpb24+KCk7XG4gIC8vICAgY29uc3Qgb3V0OiBbTG9jYXRpb25bXSwgVF1bXSA9IFtdO1xuICAvLyAgIGZvciAobGV0IGxvYyBvZiB0aGlzKSB7XG4gIC8vICAgICBpZiAoc2Vlbi5oYXMobG9jKSB8fCAhbG9jLnVzZWQpIGNvbnRpbnVlO1xuICAvLyAgICAgc2Vlbi5hZGQobG9jKTtcbiAgLy8gICAgIGNvbnN0IHZhbHVlID0gZnVuYyhsb2MpO1xuICAvLyAgICAgY29uc3QgZ3JvdXAgPSBbXTtcbiAgLy8gICAgIGNvbnN0IHF1ZXVlID0gW2xvY107XG4gIC8vICAgICB3aGlsZSAocXVldWUubGVuZ3RoKSB7XG4gIC8vICAgICAgIGNvbnN0IG5leHQgPSBxdWV1ZS5wb3AoKSE7XG4gIC8vICAgICAgIGdyb3VwLnB1c2gobmV4dCk7XG4gIC8vICAgICAgIGZvciAoY29uc3QgbiBvZiBuZXh0Lm5laWdoYm9ycyhqb2luTmV4dXNlcykpIHtcbiAgLy8gICAgICAgICBpZiAoIXNlZW4uaGFzKG4pICYmIGVxKGZ1bmMobiksIHZhbHVlKSkge1xuICAvLyAgICAgICAgICAgc2Vlbi5hZGQobik7XG4gIC8vICAgICAgICAgICBxdWV1ZS5wdXNoKG4pO1xuICAvLyAgICAgICAgIH1cbiAgLy8gICAgICAgfVxuICAvLyAgICAgfVxuICAvLyAgICAgb3V0LnB1c2goW1suLi5ncm91cF0sIHZhbHVlXSk7XG4gIC8vICAgfVxuICAvLyAgIHJldHVybiBvdXQ7XG4gIC8vIH1cbn1cblxuLy8gTG9jYXRpb24gZW50aXRpZXNcbmV4cG9ydCBjbGFzcyBMb2NhdGlvbiBleHRlbmRzIEVudGl0eSB7XG5cbiAgdXNlZDogYm9vbGVhbjtcblxuICBiZ206IG51bWJlcjtcbiAgbGF5b3V0V2lkdGg6IG51bWJlcjtcbiAgbGF5b3V0SGVpZ2h0OiBudW1iZXI7XG4gIGFuaW1hdGlvbjogbnVtYmVyO1xuICBleHRlbmRlZDogbnVtYmVyO1xuICBzY3JlZW5zOiBudW1iZXJbXVtdO1xuXG4gIHRpbGVQYXR0ZXJuczogW251bWJlciwgbnVtYmVyXTtcbiAgdGlsZVBhbGV0dGVzOiBbbnVtYmVyLCBudW1iZXIsIG51bWJlcl07XG4gIHRpbGVzZXQ6IG51bWJlcjtcbiAgdGlsZUVmZmVjdHM6IG51bWJlcjtcblxuICBlbnRyYW5jZXM6IEVudHJhbmNlW107XG4gIGV4aXRzOiBFeGl0W107XG4gIGZsYWdzOiBGbGFnW107XG4gIHBpdHM6IFBpdFtdO1xuXG4gIHNwcml0ZVBhbGV0dGVzOiBbbnVtYmVyLCBudW1iZXJdO1xuICBzcHJpdGVQYXR0ZXJuczogW251bWJlciwgbnVtYmVyXTtcbiAgc3Bhd25zOiBTcGF3bltdO1xuXG4gIGNvbnN0cnVjdG9yKHJvbTogUm9tLCBpZDogbnVtYmVyLCByZWFkb25seSBkYXRhOiBMb2NhdGlvbkRhdGEpIHtcbiAgICAvLyB3aWxsIGluY2x1ZGUgYm90aCBNYXBEYXRhICphbmQqIE5wY0RhdGEsIHNpbmNlIHRoZXkgc2hhcmUgYSBrZXkuXG4gICAgc3VwZXIocm9tLCBpZCk7XG5cbiAgICBjb25zdCBtYXBEYXRhQmFzZSA9XG4gICAgICAgIGlkID49IDAgPyByZWFkTGl0dGxlRW5kaWFuKHJvbS5wcmcsIHRoaXMubWFwRGF0YVBvaW50ZXIpICsgMHhjMDAwIDogMDtcbiAgICAvLyBUT0RPIC0gcGFzcyB0aGlzIGluIGFuZCBtb3ZlIExPQ0FUSU9OUyB0byBsb2NhdGlvbnMudHNcbiAgICB0aGlzLnVzZWQgPSBtYXBEYXRhQmFzZSA+IDB4YzAwMCAmJiAhIXRoaXMubmFtZTtcblxuICAgIGlmICghdGhpcy51c2VkKSB7XG4gICAgICB0aGlzLmJnbSA9IDA7XG4gICAgICB0aGlzLmxheW91dFdpZHRoID0gMDtcbiAgICAgIHRoaXMubGF5b3V0SGVpZ2h0ID0gMDtcbiAgICAgIHRoaXMuYW5pbWF0aW9uID0gMDtcbiAgICAgIHRoaXMuZXh0ZW5kZWQgPSAwO1xuICAgICAgdGhpcy5zY3JlZW5zID0gW1swXV07XG4gICAgICB0aGlzLnRpbGVQYWxldHRlcyA9IFsweDI0LCAweDAxLCAweDI2XTtcbiAgICAgIHRoaXMudGlsZXNldCA9IDB4ODA7XG4gICAgICB0aGlzLnRpbGVFZmZlY3RzID0gMHhiMztcbiAgICAgIHRoaXMudGlsZVBhdHRlcm5zID0gWzIsIDRdO1xuICAgICAgdGhpcy5leGl0cyA9IFtdO1xuICAgICAgdGhpcy5lbnRyYW5jZXMgPSBbXTtcbiAgICAgIHRoaXMuZmxhZ3MgPSBbXTtcbiAgICAgIHRoaXMucGl0cyA9IFtdO1xuICAgICAgdGhpcy5zcGF3bnMgPSBbXTtcbiAgICAgIHRoaXMuc3ByaXRlUGFsZXR0ZXMgPSBbMCwgMF07XG4gICAgICB0aGlzLnNwcml0ZVBhdHRlcm5zID0gWzAsIDBdO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGxheW91dEJhc2UgPSByZWFkTGl0dGxlRW5kaWFuKHJvbS5wcmcsIG1hcERhdGFCYXNlKSArIDB4YzAwMDtcbiAgICBjb25zdCBncmFwaGljc0Jhc2UgPSByZWFkTGl0dGxlRW5kaWFuKHJvbS5wcmcsIG1hcERhdGFCYXNlICsgMikgKyAweGMwMDA7XG4gICAgY29uc3QgZW50cmFuY2VzQmFzZSA9IHJlYWRMaXR0bGVFbmRpYW4ocm9tLnByZywgbWFwRGF0YUJhc2UgKyA0KSArIDB4YzAwMDtcbiAgICBjb25zdCBleGl0c0Jhc2UgPSByZWFkTGl0dGxlRW5kaWFuKHJvbS5wcmcsIG1hcERhdGFCYXNlICsgNikgKyAweGMwMDA7XG4gICAgY29uc3QgZmxhZ3NCYXNlID0gcmVhZExpdHRsZUVuZGlhbihyb20ucHJnLCBtYXBEYXRhQmFzZSArIDgpICsgMHhjMDAwO1xuXG4gICAgLy8gUmVhZCB0aGUgZXhpdHMgZmlyc3Qgc28gdGhhdCB3ZSBjYW4gZGV0ZXJtaW5lIGlmIHRoZXJlJ3MgZW50cmFuY2UvcGl0c1xuICAgIC8vIG1ldGFkYXRhIGVuY29kZWQgYXQgdGhlIGVuZC5cbiAgICBsZXQgaGFzUGl0cyA9IHRoaXMudXNlZCAmJiBsYXlvdXRCYXNlICE9PSBtYXBEYXRhQmFzZSArIDEwO1xuICAgIGxldCBlbnRyYW5jZUxlbiA9IGV4aXRzQmFzZSAtIGVudHJhbmNlc0Jhc2U7XG4gICAgdGhpcy5leGl0cyA9ICgoKSA9PiB7XG4gICAgICBjb25zdCBleGl0cyA9IFtdO1xuICAgICAgbGV0IGkgPSBleGl0c0Jhc2U7XG4gICAgICB3aGlsZSAoIShyb20ucHJnW2ldICYgMHg4MCkpIHtcbiAgICAgICAgLy8gTk9URTogc2V0IGRlc3QgdG8gRkYgdG8gZGlzYWJsZSBhbiBleGl0IChpdCdzIGFuIGludmFsaWQgbG9jYXRpb24gYW55d2F5KVxuICAgICAgICBpZiAocm9tLnByZ1tpICsgMl0gIT0gMHhmZikge1xuICAgICAgICAgIGV4aXRzLnB1c2goRXhpdC5mcm9tKHJvbS5wcmcsIGkpKTtcbiAgICAgICAgfVxuICAgICAgICBpICs9IDQ7XG4gICAgICB9XG4gICAgICBpZiAocm9tLnByZ1tpXSAhPT0gMHhmZikge1xuICAgICAgICBoYXNQaXRzID0gISEocm9tLnByZ1tpXSAmIDB4NDApO1xuICAgICAgICBlbnRyYW5jZUxlbiA9IChyb20ucHJnW2ldICYgMHgxZikgPDwgMjtcbiAgICAgIH1cbiAgICAgIHJldHVybiBleGl0cztcbiAgICB9KSgpO1xuXG4gICAgLy8gVE9ETyAtIHRoZXNlIGhldXJpc3RpY3Mgd2lsbCBub3Qgd29yayB0byByZS1yZWFkIHRoZSBsb2NhdGlvbnMuXG4gICAgLy8gICAgICAtIHdlIGNhbiBsb29rIGF0IHRoZSBvcmRlcjogaWYgdGhlIGRhdGEgaXMgQkVGT1JFIHRoZSBwb2ludGVyc1xuICAgIC8vICAgICAgICB0aGVuIHdlJ3JlIGluIGEgcmV3cml0dGVuIHN0YXRlOyBpbiB0aGF0IGNhc2UsIHdlIG5lZWQgdG8gc2ltcGx5XG4gICAgLy8gICAgICAgIGZpbmQgYWxsIHJlZnMgYW5kIG1heC4uLj9cbiAgICAvLyAgICAgIC0gY2FuIHdlIHJlYWQgdGhlc2UgcGFydHMgbGF6aWx5P1xuICAgIGNvbnN0IHBpdHNCYXNlID1cbiAgICAgICAgIWhhc1BpdHMgPyAwIDogcmVhZExpdHRsZUVuZGlhbihyb20ucHJnLCBtYXBEYXRhQmFzZSArIDEwKSArIDB4YzAwMDtcblxuICAgIHRoaXMuYmdtID0gcm9tLnByZ1tsYXlvdXRCYXNlXTtcbiAgICB0aGlzLmxheW91dFdpZHRoID0gcm9tLnByZ1tsYXlvdXRCYXNlICsgMV07XG4gICAgdGhpcy5sYXlvdXRIZWlnaHQgPSByb20ucHJnW2xheW91dEJhc2UgKyAyXTtcbiAgICB0aGlzLmFuaW1hdGlvbiA9IHJvbS5wcmdbbGF5b3V0QmFzZSArIDNdO1xuICAgIHRoaXMuZXh0ZW5kZWQgPSByb20ucHJnW2xheW91dEJhc2UgKyA0XTtcbiAgICB0aGlzLnNjcmVlbnMgPSBzZXEoXG4gICAgICAgIHRoaXMuaGVpZ2h0LFxuICAgICAgICB5ID0+IHR1cGxlKHJvbS5wcmcsIGxheW91dEJhc2UgKyA1ICsgeSAqIHRoaXMud2lkdGgsIHRoaXMud2lkdGgpKTtcbiAgICB0aGlzLnRpbGVQYWxldHRlcyA9IHR1cGxlPG51bWJlcj4ocm9tLnByZywgZ3JhcGhpY3NCYXNlLCAzKTtcbiAgICB0aGlzLnRpbGVzZXQgPSByb20ucHJnW2dyYXBoaWNzQmFzZSArIDNdO1xuICAgIHRoaXMudGlsZUVmZmVjdHMgPSByb20ucHJnW2dyYXBoaWNzQmFzZSArIDRdO1xuICAgIHRoaXMudGlsZVBhdHRlcm5zID0gdHVwbGUocm9tLnByZywgZ3JhcGhpY3NCYXNlICsgNSwgMik7XG5cbiAgICB0aGlzLmVudHJhbmNlcyA9XG4gICAgICBncm91cCg0LCByb20ucHJnLnNsaWNlKGVudHJhbmNlc0Jhc2UsIGVudHJhbmNlc0Jhc2UgKyBlbnRyYW5jZUxlbiksXG4gICAgICAgICAgICB4ID0+IEVudHJhbmNlLmZyb20oeCkpO1xuICAgIHRoaXMuZmxhZ3MgPSB2YXJTbGljZShyb20ucHJnLCBmbGFnc0Jhc2UsIDIsIDB4ZmYsIEluZmluaXR5LFxuICAgICAgICAgICAgICAgICAgICAgICAgICB4ID0+IEZsYWcuZnJvbSh4KSk7XG4gICAgdGhpcy5waXRzID0gcGl0c0Jhc2UgPyB2YXJTbGljZShyb20ucHJnLCBwaXRzQmFzZSwgNCwgMHhmZiwgSW5maW5pdHksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4ID0+IFBpdC5mcm9tKHgpKSA6IFtdO1xuXG4gICAgY29uc3QgbnBjRGF0YUJhc2UgPSByZWFkTGl0dGxlRW5kaWFuKHJvbS5wcmcsIHRoaXMubnBjRGF0YVBvaW50ZXIpICsgMHgxMDAwMDtcbiAgICBjb25zdCBoYXNTcGF3bnMgPSBucGNEYXRhQmFzZSAhPT0gMHgxMDAwMDtcbiAgICB0aGlzLnNwcml0ZVBhbGV0dGVzID1cbiAgICAgICAgaGFzU3Bhd25zID8gdHVwbGUocm9tLnByZywgbnBjRGF0YUJhc2UgKyAxLCAyKSA6IFswLCAwXTtcbiAgICB0aGlzLnNwcml0ZVBhdHRlcm5zID1cbiAgICAgICAgaGFzU3Bhd25zID8gdHVwbGUocm9tLnByZywgbnBjRGF0YUJhc2UgKyAzLCAyKSA6IFswLCAwXTtcbiAgICB0aGlzLnNwYXducyA9XG4gICAgICAgIGhhc1NwYXducyA/IHZhclNsaWNlKHJvbS5wcmcsIG5wY0RhdGFCYXNlICsgNSwgNCwgMHhmZiwgSW5maW5pdHksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHggPT4gU3Bhd24uZnJvbSh4KSkgOiBbXTtcbiAgfVxuXG4gIGdldCBuYW1lKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuZGF0YS5uYW1lO1xuICB9XG5cbiAgZ2V0IG1hcERhdGFQb2ludGVyKCk6IG51bWJlciB7XG4gICAgaWYgKHRoaXMuaWQgPCAwKSB0aHJvdyBuZXcgRXJyb3IoYG5vIG1hcGRhdGEgcG9pbnRlciBmb3IgJHt0aGlzLm5hbWV9YCk7XG4gICAgcmV0dXJuIDB4MTQzMDAgKyAodGhpcy5pZCA8PCAxKTtcbiAgfVxuXG4gIGdldCBucGNEYXRhUG9pbnRlcigpOiBudW1iZXIge1xuICAgIGlmICh0aGlzLmlkIDwgMCkgdGhyb3cgbmV3IEVycm9yKGBubyBucGNkYXRhIHBvaW50ZXIgZm9yICR7dGhpcy5uYW1lfWApO1xuICAgIHJldHVybiAweDE5MjAxICsgKHRoaXMuaWQgPDwgMSk7XG4gIH1cblxuICBnZXQgaGFzU3Bhd25zKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLnNwYXducy5sZW5ndGggPiAwO1xuICB9XG5cbiAgLy8gT2Zmc2V0IHRvIE9SIHdpdGggc2NyZWVuIElEcy5cbiAgZ2V0IHNjcmVlblBhZ2UoKTogbnVtYmVyIHtcbiAgICBpZiAoIXRoaXMucm9tLmNvbXByZXNzZWRNYXBEYXRhKSByZXR1cm4gdGhpcy5leHRlbmRlZCA/IDB4MTAwIDogMDtcbiAgICByZXR1cm4gdGhpcy5leHRlbmRlZCA8PCA4O1xuICB9XG5cbiAgaXNTaG9wKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLnJvbS5zaG9wcy5maW5kSW5kZXgocyA9PiBzLmxvY2F0aW9uID09PSB0aGlzLmlkKSA+PSAwO1xuICB9XG5cbiAgc3Bhd24oaWQ6IG51bWJlcik6IFNwYXduIHtcbiAgICBjb25zdCBzcGF3biA9IHRoaXMuc3Bhd25zW2lkIC0gMHhkXTtcbiAgICBpZiAoIXNwYXduKSB0aHJvdyBuZXcgRXJyb3IoYEV4cGVjdGVkIHNwYXduICQke2hleChpZCl9YCk7XG4gICAgcmV0dXJuIHNwYXduO1xuICB9XG5cbiAgZ2V0IHdpZHRoKCk6IG51bWJlciB7IHJldHVybiB0aGlzLmxheW91dFdpZHRoICsgMTsgfVxuICBzZXQgd2lkdGgod2lkdGg6IG51bWJlcikgeyB0aGlzLmxheW91dFdpZHRoID0gd2lkdGggLSAxOyB9XG5cbiAgZ2V0IGhlaWdodCgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5sYXlvdXRIZWlnaHQgKyAxOyB9XG4gIHNldCBoZWlnaHQoaGVpZ2h0OiBudW1iZXIpIHsgdGhpcy5sYXlvdXRIZWlnaHQgPSBoZWlnaHQgLSAxOyB9XG5cbiAgLy8gbW9uc3RlcnMoKSB7XG4gIC8vICAgaWYgKCF0aGlzLnNwYXducykgcmV0dXJuIFtdO1xuICAvLyAgIHJldHVybiB0aGlzLnNwYXducy5mbGF0TWFwKFxuICAvLyAgICAgKFssLCB0eXBlLCBpZF0sIHNsb3QpID0+XG4gIC8vICAgICAgIHR5cGUgJiA3IHx8ICF0aGlzLnJvbS5zcGF3bnNbaWQgKyAweDUwXSA/IFtdIDogW1xuICAvLyAgICAgICAgIFt0aGlzLmlkLFxuICAvLyAgICAgICAgICBzbG90ICsgMHgwZCxcbiAgLy8gICAgICAgICAgdHlwZSAmIDB4ODAgPyAxIDogMCxcbiAgLy8gICAgICAgICAgaWQgKyAweDUwLFxuICAvLyAgICAgICAgICB0aGlzLnNwcml0ZVBhdHRlcm5zW3R5cGUgJiAweDgwID8gMSA6IDBdLFxuICAvLyAgICAgICAgICB0aGlzLnJvbS5zcGF3bnNbaWQgKyAweDUwXS5wYWxldHRlcygpWzBdLFxuICAvLyAgICAgICAgICB0aGlzLnNwcml0ZVBhbGV0dGVzW3RoaXMucm9tLnNwYXduc1tpZCArIDB4NTBdLnBhbGV0dGVzKClbMF0gLSAyXSxcbiAgLy8gICAgICAgICBdXSk7XG4gIC8vIH1cblxuICBhc3luYyB3cml0ZSh3cml0ZXI6IFdyaXRlcik6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICghdGhpcy51c2VkKSByZXR1cm47XG4gICAgY29uc3QgcHJvbWlzZXMgPSBbXTtcbiAgICBpZiAoIXRoaXMuc3Bhd25zLmxlbmd0aCkge1xuICAgICAgdGhpcy5zcHJpdGVQYWxldHRlcyA9IFsweGZmLCAweGZmXTtcbiAgICAgIHRoaXMuc3ByaXRlUGF0dGVybnMgPSBbMHhmZiwgMHhmZl07XG4gICAgfVxuICAgIC8vIHdyaXRlIE5QQyBkYXRhIGZpcnN0LCBpZiBwcmVzZW50Li4uXG4gICAgY29uc3QgZGF0YSA9IFswLCAuLi50aGlzLnNwcml0ZVBhbGV0dGVzLCAuLi50aGlzLnNwcml0ZVBhdHRlcm5zLFxuICAgICAgICAgICAgICAgICAgLi4uY29uY2F0SXRlcmFibGVzKHRoaXMuc3Bhd25zKSwgMHhmZl07XG4gICAgcHJvbWlzZXMucHVzaChcbiAgICAgICAgd3JpdGVyLndyaXRlKGRhdGEsIDB4MTgwMDAsIDB4MWJmZmYsIGBOcGNEYXRhICR7aGV4KHRoaXMuaWQpfWApXG4gICAgICAgICAgICAudGhlbihhZGRyZXNzID0+IHdyaXRlTGl0dGxlRW5kaWFuKFxuICAgICAgICAgICAgICAgIHdyaXRlci5yb20sIHRoaXMubnBjRGF0YVBvaW50ZXIsIGFkZHJlc3MgLSAweDEwMDAwKSkpO1xuICAgIGNvbnN0IHdyaXRlID0gKGRhdGE6IERhdGE8bnVtYmVyPiwgbmFtZTogc3RyaW5nKSA9PlxuICAgICAgICB3cml0ZXIud3JpdGUoZGF0YSwgMHgxNDAwMCwgMHgxN2ZmZiwgYCR7bmFtZX0gJHtoZXgodGhpcy5pZCl9YCk7XG4gICAgY29uc3QgbGF5b3V0ID0gdGhpcy5yb20uY29tcHJlc3NlZE1hcERhdGEgPyBbXG4gICAgICB0aGlzLmJnbSxcbiAgICAgIC8vIENvbXByZXNzZWQgdmVyc2lvbjogeXggaW4gb25lIGJ5dGUsIGV4dCthbmltIGluIG9uZSBieXRlXG4gICAgICB0aGlzLmxheW91dEhlaWdodCA8PCA0IHwgdGhpcy5sYXlvdXRXaWR0aCxcbiAgICAgIHRoaXMuZXh0ZW5kZWQgPDwgMiB8IHRoaXMuYW5pbWF0aW9uLFxuICAgICAgLi4uY29uY2F0SXRlcmFibGVzKHRoaXMuc2NyZWVucyksXG4gICAgXSA6IFtcbiAgICAgIHRoaXMuYmdtLFxuICAgICAgdGhpcy5sYXlvdXRXaWR0aCwgdGhpcy5sYXlvdXRIZWlnaHQsIHRoaXMuYW5pbWF0aW9uLCB0aGlzLmV4dGVuZGVkLFxuICAgICAgLi4uY29uY2F0SXRlcmFibGVzKHRoaXMuc2NyZWVucyksXG4gICAgXTtcbiAgICBjb25zdCBncmFwaGljcyA9XG4gICAgICAgIFsuLi50aGlzLnRpbGVQYWxldHRlcyxcbiAgICAgICAgIHRoaXMudGlsZXNldCwgdGhpcy50aWxlRWZmZWN0cyxcbiAgICAgICAgIC4uLnRoaXMudGlsZVBhdHRlcm5zXTtcbiAgICAvLyBRdWljayBzYW5pdHkgY2hlY2s6IGlmIGFuIGVudHJhbmNlL2V4aXQgaXMgYmVsb3cgdGhlIEhVRCBvbiBhXG4gICAgLy8gbm9uLXZlcnRpY2FsbHkgc2Nyb2xsaW5nIG1hcCwgdGhlbiB3ZSBuZWVkIHRvIG1vdmUgaXQgdXAuXG4gICAgaWYgKHRoaXMuaGVpZ2h0ID09PSAxKSB7XG4gICAgICBmb3IgKGNvbnN0IGVudHJhbmNlIG9mIHRoaXMuZW50cmFuY2VzKSB7XG4gICAgICAgIGlmICghZW50cmFuY2UudXNlZCkgY29udGludWU7XG4gICAgICAgIGlmIChlbnRyYW5jZS55ID4gMHhiZikgZW50cmFuY2UueSA9IDB4YmY7XG4gICAgICB9XG4gICAgICBmb3IgKGNvbnN0IGV4aXQgb2YgdGhpcy5leGl0cykge1xuICAgICAgICBpZiAoZXhpdC55dCA+IDB4MGMpIGV4aXQueXQgPSAweDBjO1xuICAgICAgfVxuICAgIH1cbiAgICBjb25zdCBlbnRyYW5jZXMgPSBjb25jYXRJdGVyYWJsZXModGhpcy5lbnRyYW5jZXMpO1xuICAgIGNvbnN0IGV4aXRzID0gWy4uLmNvbmNhdEl0ZXJhYmxlcyh0aGlzLmV4aXRzKSxcbiAgICAgICAgICAgICAgICAgICAweDgwIHwgKHRoaXMucGl0cy5sZW5ndGggPyAweDQwIDogMCkgfCB0aGlzLmVudHJhbmNlcy5sZW5ndGgsXG4gICAgICAgICAgICAgICAgICBdO1xuICAgIGNvbnN0IGZsYWdzID0gWy4uLmNvbmNhdEl0ZXJhYmxlcyh0aGlzLmZsYWdzKSwgMHhmZl07XG4gICAgY29uc3QgcGl0cyA9IGNvbmNhdEl0ZXJhYmxlcyh0aGlzLnBpdHMpO1xuICAgIGNvbnN0IFtsYXlvdXRBZGRyLCBncmFwaGljc0FkZHIsIGVudHJhbmNlc0FkZHIsIGV4aXRzQWRkciwgZmxhZ3NBZGRyLCBwaXRzQWRkcl0gPVxuICAgICAgICBhd2FpdCBQcm9taXNlLmFsbChbXG4gICAgICAgICAgd3JpdGUobGF5b3V0LCAnTGF5b3V0JyksXG4gICAgICAgICAgd3JpdGUoZ3JhcGhpY3MsICdHcmFwaGljcycpLFxuICAgICAgICAgIHdyaXRlKGVudHJhbmNlcywgJ0VudHJhbmNlcycpLFxuICAgICAgICAgIHdyaXRlKGV4aXRzLCAnRXhpdHMnKSxcbiAgICAgICAgICB3cml0ZShmbGFncywgJ0ZsYWdzJyksXG4gICAgICAgICAgLi4uKHBpdHMubGVuZ3RoID8gW3dyaXRlKHBpdHMsICdQaXRzJyldIDogW10pLFxuICAgICAgICBdKTtcbiAgICBjb25zdCBhZGRyZXNzZXMgPSBbXG4gICAgICBsYXlvdXRBZGRyICYgMHhmZiwgKGxheW91dEFkZHIgPj4+IDgpIC0gMHhjMCxcbiAgICAgIGdyYXBoaWNzQWRkciAmIDB4ZmYsIChncmFwaGljc0FkZHIgPj4+IDgpIC0gMHhjMCxcbiAgICAgIGVudHJhbmNlc0FkZHIgJiAweGZmLCAoZW50cmFuY2VzQWRkciA+Pj4gOCkgLSAweGMwLFxuICAgICAgZXhpdHNBZGRyICYgMHhmZiwgKGV4aXRzQWRkciA+Pj4gOCkgLSAweGMwLFxuICAgICAgZmxhZ3NBZGRyICYgMHhmZiwgKGZsYWdzQWRkciA+Pj4gOCkgLSAweGMwLFxuICAgICAgLi4uKHBpdHNBZGRyID8gW3BpdHNBZGRyICYgMHhmZiwgKHBpdHNBZGRyID4+IDgpIC0gMHhjMF0gOiBbXSksXG4gICAgXTtcbiAgICBjb25zdCBiYXNlID0gYXdhaXQgd3JpdGUoYWRkcmVzc2VzLCAnTWFwRGF0YScpO1xuICAgIHdyaXRlTGl0dGxlRW5kaWFuKHdyaXRlci5yb20sIHRoaXMubWFwRGF0YVBvaW50ZXIsIGJhc2UgLSAweGMwMDApO1xuICAgIGF3YWl0IFByb21pc2UuYWxsKHByb21pc2VzKTtcblxuICAgIC8vIElmIHRoaXMgaXMgYSBib3NzIHJvb20sIHdyaXRlIHRoZSByZXN0b3JhdGlvbi5cbiAgICBjb25zdCBib3NzSWQgPSB0aGlzLmJvc3NJZCgpO1xuICAgIGlmIChib3NzSWQgIT0gbnVsbCAmJiB0aGlzLmlkICE9PSAweDVmKSB7IC8vIGRvbid0IHJlc3RvcmUgZHluYVxuICAgICAgLy8gVGhpcyB0YWJsZSBzaG91bGQgcmVzdG9yZSBwYXQwIGJ1dCBub3QgcGF0MVxuICAgICAgbGV0IHBhdHMgPSBbdGhpcy5zcHJpdGVQYXR0ZXJuc1swXSwgdW5kZWZpbmVkXTtcbiAgICAgIGlmICh0aGlzLmlkID09PSAweGE2KSBwYXRzID0gWzB4NTMsIDB4NTBdOyAvLyBkcmF5Z29uIDJcbiAgICAgIGNvbnN0IGJvc3NCYXNlID0gcmVhZExpdHRsZUVuZGlhbih3cml0ZXIucm9tLCAweDFmOTZiICsgMiAqIGJvc3NJZCkgKyAweDE0MDAwO1xuICAgICAgLy8gU2V0IHRoZSBcInJlc3RvcmUgbXVzaWNcIiBieXRlIGZvciB0aGUgYm9zcywgYnV0IGlmIGl0J3MgRHJheWdvbiAyLCBzZXRcbiAgICAgIC8vIGl0IHRvIHplcm8gc2luY2Ugbm8gbXVzaWMgaXMgYWN0dWFsbHkgcGxheWluZywgYW5kIGlmIHRoZSBtdXNpYyBpbiB0aGVcbiAgICAgIC8vIHRlbGVwb3J0ZXIgcm9vbSBoYXBwZW5zIHRvIGJlIHRoZSBzYW1lIGFzIHRoZSBtdXNpYyBpbiB0aGUgY3J5cHQsIHRoZW5cbiAgICAgIC8vIHJlc2V0dGluZyB0byB0aGF0IG1lYW5zIGl0IHdpbGwganVzdCByZW1haW4gc2lsZW50LCBhbmQgbm90IHJlc3RhcnQuXG4gICAgICBjb25zdCByZXN0b3JlQmdtID0gdGhpcy5pZCA9PT0gMHhhNiA/IDAgOiB0aGlzLmJnbTtcbiAgICAgIGNvbnN0IGJvc3NSZXN0b3JlID0gW1xuICAgICAgICAsLCwgcmVzdG9yZUJnbSwsXG4gICAgICAgIC4uLnRoaXMudGlsZVBhbGV0dGVzLCwsLCB0aGlzLnNwcml0ZVBhbGV0dGVzWzBdLCxcbiAgICAgICAgLCwsLCAvKnBhdHNbMF0qLywgLypwYXRzWzFdKi8sXG4gICAgICAgIHRoaXMuYW5pbWF0aW9uLFxuICAgICAgXTtcbiAgICAgIGNvbnN0IFtdID0gW3BhdHNdOyAvLyBhdm9pZCBlcnJvclxuXG4gICAgICAvLyBpZiAocmVhZExpdHRsZUVuZGlhbih3cml0ZXIucm9tLCBib3NzQmFzZSkgPT09IDB4YmE5OCkge1xuICAgICAgLy8gICAvLyBlc2NhcGUgYW5pbWF0aW9uOiBkb24ndCBjbG9iYmVyIHBhdHRlcm5zIHlldD9cbiAgICAgIC8vIH1cbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgYm9zc1Jlc3RvcmUubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgY29uc3QgcmVzdG9yZWQgPSBib3NzUmVzdG9yZVtqXTtcbiAgICAgICAgaWYgKHJlc3RvcmVkID09IG51bGwpIGNvbnRpbnVlO1xuICAgICAgICB3cml0ZXIucm9tW2Jvc3NCYXNlICsgal0gPSByZXN0b3JlZDtcbiAgICAgIH1cbiAgICAgIC8vIGxhdGVyIHNwb3QgZm9yIHBhbDMgYW5kIHBhdDEgKmFmdGVyKiBleHBsb3Npb25cbiAgICAgIGNvbnN0IGJvc3NCYXNlMiA9IDB4MWY3YzEgKyA1ICogYm9zc0lkO1xuICAgICAgd3JpdGVyLnJvbVtib3NzQmFzZTJdID0gdGhpcy5zcHJpdGVQYWxldHRlc1sxXTtcbiAgICAgIC8vIE5PVEU6IFRoaXMgcnVpbnMgdGhlIHRyZWFzdXJlIGNoZXN0LlxuICAgICAgLy8gVE9ETyAtIGFkZCBzb21lIGFzbSBhZnRlciBhIGNoZXN0IGlzIGNsZWFyZWQgdG8gcmVsb2FkIHBhdHRlcm5zP1xuICAgICAgLy8gQW5vdGhlciBvcHRpb24gd291bGQgYmUgdG8gYWRkIGEgbG9jYXRpb24tc3BlY2lmaWMgY29udHJhaW50IHRvIGJlXG4gICAgICAvLyB3aGF0ZXZlciB0aGUgYm9zcyBcbiAgICAgIC8vd3JpdGVyLnJvbVtib3NzQmFzZTIgKyAxXSA9IHRoaXMuc3ByaXRlUGF0dGVybnNbMV07XG4gICAgfVxuICB9XG5cbiAgYWxsU2NyZWVucygpOiBTZXQ8U2NyZWVuPiB7XG4gICAgY29uc3Qgc2NyZWVucyA9IG5ldyBTZXQ8U2NyZWVuPigpO1xuICAgIGNvbnN0IGV4dCA9IHRoaXMuc2NyZWVuUGFnZTtcbiAgICBmb3IgKGNvbnN0IHJvdyBvZiB0aGlzLnNjcmVlbnMpIHtcbiAgICAgIGZvciAoY29uc3Qgc2NyZWVuIG9mIHJvdykge1xuICAgICAgICBzY3JlZW5zLmFkZCh0aGlzLnJvbS5zY3JlZW5zW3NjcmVlbiArIGV4dF0pO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gc2NyZWVucztcbiAgfVxuXG4gIGJvc3NJZCgpOiBudW1iZXIgfCB1bmRlZmluZWQge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMHgwZTsgaSsrKSB7XG4gICAgICBpZiAodGhpcy5yb20ucHJnWzB4MWY5NWQgKyBpXSA9PT0gdGhpcy5pZCkgcmV0dXJuIGk7XG4gICAgfVxuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICAvLyBuZWlnaGJvcnMoam9pbk5leHVzZXM6IGJvb2xlYW4gPSBmYWxzZSk6IFNldDxMb2NhdGlvbj4ge1xuICAvLyAgIGNvbnN0IG91dCA9IG5ldyBTZXQ8TG9jYXRpb24+KCk7XG4gIC8vICAgY29uc3QgYWRkTmVpZ2hib3JzID0gKGw6IExvY2F0aW9uKSA9PiB7XG4gIC8vICAgICBmb3IgKGNvbnN0IGV4aXQgb2YgbC5leGl0cykge1xuICAvLyAgICAgICBjb25zdCBpZCA9IGV4aXQuZGVzdDtcbiAgLy8gICAgICAgY29uc3QgbmVpZ2hib3IgPSB0aGlzLnJvbS5sb2NhdGlvbnNbaWRdO1xuICAvLyAgICAgICBpZiAobmVpZ2hib3IgJiYgbmVpZ2hib3IudXNlZCAmJlxuICAvLyAgICAgICAgICAgbmVpZ2hib3IgIT09IHRoaXMgJiYgIW91dC5oYXMobmVpZ2hib3IpKSB7XG4gIC8vICAgICAgICAgb3V0LmFkZChuZWlnaGJvcik7XG4gIC8vICAgICAgICAgaWYgKGpvaW5OZXh1c2VzICYmIE5FWFVTRVNbbmVpZ2hib3Iua2V5XSkge1xuICAvLyAgICAgICAgICAgYWRkTmVpZ2hib3JzKG5laWdoYm9yKTtcbiAgLy8gICAgICAgICB9XG4gIC8vICAgICAgIH1cbiAgLy8gICAgIH1cbiAgLy8gICB9XG4gIC8vICAgYWRkTmVpZ2hib3JzKHRoaXMpO1xuICAvLyAgIHJldHVybiBvdXQ7XG4gIC8vIH1cblxuICBoYXNEb2xwaGluKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmlkID09PSAweDYwIHx8IHRoaXMuaWQgPT09IDB4NjQgfHwgdGhpcy5pZCA9PT0gMHg2ODtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIE1hcCBvZiB0aWxlcyAoJFlYeXgpIHJlYWNoYWJsZSBmcm9tIGFueSBlbnRyYW5jZSB0b1xuICAgKiB1bmZsYWdnZWQgdGlsZWVmZmVjdHMuXG4gICAqL1xuICByZWFjaGFibGVUaWxlcyhmbHkgPSBmYWxzZSk6IE1hcDxudW1iZXIsIG51bWJlcj4ge1xuICAgIC8vIFRPRE8gLSBhcmdzIGZvciAoMSkgdXNlIG5vbi0yZWYgZmxhZ3MsICgyKSBvbmx5IGZyb20gZ2l2ZW4gZW50cmFuY2UvdGlsZVxuICAgIC8vIERvbHBoaW4gbWFrZXMgTk9fV0FMSyBva2F5IGZvciBzb21lIGxldmVscy5cbiAgICBpZiAodGhpcy5oYXNEb2xwaGluKCkpIGZseSA9IHRydWU7XG4gICAgLy8gVGFrZSBpbnRvIGFjY291bnQgdGhlIHRpbGVzZXQgYW5kIGZsYWdzIGJ1dCBub3QgYW55IG92ZXJsYXkuXG4gICAgY29uc3QgZXhpdHMgPSBuZXcgU2V0KHRoaXMuZXhpdHMubWFwKGV4aXQgPT4gZXhpdC5zY3JlZW4gPDwgOCB8IGV4aXQudGlsZSkpO1xuICAgIGNvbnN0IHVmID0gbmV3IFVuaW9uRmluZDxudW1iZXI+KCk7XG4gICAgY29uc3QgdGlsZXNldCA9IHRoaXMucm9tLnRpbGVzZXQodGhpcy50aWxlc2V0KTtcbiAgICBjb25zdCB0aWxlRWZmZWN0cyA9IHRoaXMucm9tLnRpbGVFZmZlY3RzW3RoaXMudGlsZUVmZmVjdHMgLSAweGIzXTtcbiAgICBjb25zdCBwYXNzYWJsZSA9IG5ldyBTZXQ8bnVtYmVyPigpO1xuICAgIFxuICAgIGZvciAobGV0IHkgPSAwOyB5IDwgdGhpcy5oZWlnaHQ7IHkrKykge1xuICAgICAgY29uc3Qgcm93ID0gdGhpcy5zY3JlZW5zW3ldO1xuICAgICAgZm9yIChsZXQgeCA9IDA7IHggPCB0aGlzLndpZHRoOyB4KyspIHtcbiAgICAgICAgY29uc3Qgc2NyZWVuID0gdGhpcy5yb20uc2NyZWVuc1tyb3dbeF0gfCB0aGlzLnNjcmVlblBhZ2VdO1xuICAgICAgICBjb25zdCBwb3MgPSB5IDw8IDQgfCB4O1xuICAgICAgICBjb25zdCBmbGFnID0gdGhpcy5mbGFncy5maW5kKGYgPT4gZi5zY3JlZW4gPT09IHBvcyk7XG4gICAgICAgIGZvciAobGV0IHQgPSAwOyB0IDwgMHhmMDsgdCsrKSB7XG4gICAgICAgICAgY29uc3QgdGlsZUlkID0gcG9zIDw8IDggfCB0O1xuICAgICAgICAgIGlmIChleGl0cy5oYXModGlsZUlkKSkgY29udGludWU7IC8vIGRvbid0IGdvIHBhc3QgZXhpdHNcbiAgICAgICAgICBsZXQgdGlsZSA9IHNjcmVlbi50aWxlc1t0XTtcbiAgICAgICAgICAvLyBmbGFnIDJlZiBpcyBcImFsd2F5cyBvblwiLCBkb24ndCBldmVuIGJvdGhlciBtYWtpbmcgaXQgY29uZGl0aW9uYWwuXG4gICAgICAgICAgbGV0IGVmZmVjdHMgPSB0aWxlRWZmZWN0cy5lZmZlY3RzW3RpbGVdO1xuICAgICAgICAgIGxldCBibG9ja2VkID0gZmx5ID8gZWZmZWN0cyAmIDB4MDQgOiBlZmZlY3RzICYgMHgwNjtcbiAgICAgICAgICBpZiAoZmxhZyAmJiBibG9ja2VkICYmIHRpbGUgPCAweDIwICYmIHRpbGVzZXQuYWx0ZXJuYXRlc1t0aWxlXSAhPSB0aWxlKSB7XG4gICAgICAgICAgICB0aWxlID0gdGlsZXNldC5hbHRlcm5hdGVzW3RpbGVdO1xuICAgICAgICAgICAgZWZmZWN0cyA9IHRpbGVFZmZlY3RzLmVmZmVjdHNbdGlsZV07XG4gICAgICAgICAgICBibG9ja2VkID0gZmx5ID8gZWZmZWN0cyAmIDB4MDQgOiBlZmZlY3RzICYgMHgwNjtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKCFibG9ja2VkKSBwYXNzYWJsZS5hZGQodGlsZUlkKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGZvciAobGV0IHQgb2YgcGFzc2FibGUpIHtcbiAgICAgIGNvbnN0IHJpZ2h0ID0gKHQgJiAweDBmKSA9PT0gMHgwZiA/IHQgKyAweGYxIDogdCArIDE7XG4gICAgICBpZiAocGFzc2FibGUuaGFzKHJpZ2h0KSkgdWYudW5pb24oW3QsIHJpZ2h0XSk7XG4gICAgICBjb25zdCBiZWxvdyA9ICh0ICYgMHhmMCkgPT09IDB4ZTAgPyB0ICsgMHhmMjAgOiB0ICsgMTY7XG4gICAgICBpZiAocGFzc2FibGUuaGFzKGJlbG93KSkgdWYudW5pb24oW3QsIGJlbG93XSk7XG4gICAgfVxuXG4gICAgY29uc3QgbWFwID0gdWYubWFwKCk7XG4gICAgY29uc3Qgc2V0cyA9IG5ldyBTZXQ8U2V0PG51bWJlcj4+KCk7XG4gICAgZm9yIChjb25zdCBlbnRyYW5jZSBvZiB0aGlzLmVudHJhbmNlcykge1xuICAgICAgaWYgKCFlbnRyYW5jZS51c2VkKSBjb250aW51ZTtcbiAgICAgIGNvbnN0IGlkID0gZW50cmFuY2Uuc2NyZWVuIDw8IDggfCBlbnRyYW5jZS50aWxlO1xuICAgICAgLy8gTk9URTogbWFwIHNob3VsZCBhbHdheXMgaGF2ZSBpZCwgYnV0IGJvZ3VzIGVudHJhbmNlc1xuICAgICAgLy8gKGUuZy4gR29hIFZhbGxleSBlbnRyYW5jZSAyKSBjYW4gY2F1c2UgcHJvYmxlbXMuXG4gICAgICBzZXRzLmFkZChtYXAuZ2V0KGlkKSB8fCBuZXcgU2V0KCkpO1xuICAgIH1cblxuICAgIGNvbnN0IG91dCA9IG5ldyBNYXA8bnVtYmVyLCBudW1iZXI+KCk7XG4gICAgZm9yIChjb25zdCBzZXQgb2Ygc2V0cykge1xuICAgICAgZm9yIChjb25zdCB0IG9mIHNldCkge1xuICAgICAgICBjb25zdCBzY3IgPSB0aGlzLnNjcmVlbnNbdCA+Pj4gMTJdWyh0ID4+PiA4KSAmIDB4MGZdO1xuICAgICAgICBjb25zdCBzY3JlZW4gPSB0aGlzLnJvbS5zY3JlZW5zW3NjciB8IHRoaXMuc2NyZWVuUGFnZV07XG4gICAgICAgIG91dC5zZXQodCwgdGlsZUVmZmVjdHMuZWZmZWN0c1tzY3JlZW4udGlsZXNbdCAmIDB4ZmZdXSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBvdXQ7XG4gIH1cblxuICAvKiogU2FmZXIgdmVyc2lvbiBvZiB0aGUgYmVsb3c/ICovXG4gIHNjcmVlbk1vdmVyKCk6IChvcmlnOiBudW1iZXIsIHJlcGw6IG51bWJlcikgPT4gdm9pZCB7XG4gICAgY29uc3QgbWFwID0gbmV3IERlZmF1bHRNYXA8bnVtYmVyLCBBcnJheTx7c2NyZWVuOiBudW1iZXJ9Pj4oKCkgPT4gW10pO1xuICAgIGNvbnN0IG9ianMgPVxuICAgICAgICBpdGVycy5jb25jYXQ8e3NjcmVlbjogbnVtYmVyfT4odGhpcy5zcGF3bnMsIHRoaXMuZXhpdHMsIHRoaXMuZW50cmFuY2VzKTtcbiAgICBmb3IgKGNvbnN0IG9iaiBvZiBvYmpzKSB7XG4gICAgICBtYXAuZ2V0KG9iai5zY3JlZW4pLnB1c2gob2JqKTtcbiAgICB9XG4gICAgcmV0dXJuIChvcmlnOiBudW1iZXIsIHJlcGw6IG51bWJlcikgPT4ge1xuICAgICAgZm9yIChjb25zdCBvYmogb2YgbWFwLmdldChvcmlnKSkge1xuICAgICAgICBvYmouc2NyZWVuID0gcmVwbDtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIE1vdmVzIGFsbCBzcGF3bnMsIGVudHJhbmNlcywgYW5kIGV4aXRzLlxuICAgKiBAcGFyYW0gb3JpZyBZWCBvZiB0aGUgb3JpZ2luYWwgc2NyZWVuLlxuICAgKiBAcGFyYW0gcmVwbCBZWCBvZiB0aGUgZXF1aXZhbGVudCByZXBsYWNlbWVudCBzY3JlZW4uXG4gICAqL1xuICBtb3ZlU2NyZWVuKG9yaWc6IG51bWJlciwgcmVwbDogbnVtYmVyKTogdm9pZCB7XG4gICAgY29uc3Qgb2JqcyA9XG4gICAgICAgIGl0ZXJzLmNvbmNhdDx7c2NyZWVuOiBudW1iZXJ9Pih0aGlzLnNwYXducywgdGhpcy5leGl0cywgdGhpcy5lbnRyYW5jZXMpO1xuICAgIGZvciAoY29uc3Qgb2JqIG9mIG9ianMpIHtcbiAgICAgIGlmIChvYmouc2NyZWVuID09PSBvcmlnKSBvYmouc2NyZWVuID0gcmVwbDtcbiAgICB9XG4gIH1cblxuICAvLyBUT0RPIC0gZmFjdG9yIHRoaXMgb3V0IGludG8gYSBzZXBhcmF0ZSBjbGFzcz9cbiAgLy8gICAtIGhvbGRzIG1ldGFkYXRhIGFib3V0IG1hcCB0aWxlcyBpbiBnZW5lcmFsP1xuICAvLyAgIC0gbmVlZCB0byBmaWd1cmUgb3V0IHdoYXQgdG8gZG8gd2l0aCBwaXRzLi4uXG4gIG1vbnN0ZXJQbGFjZXIocmFuZG9tOiBSYW5kb20pOiAobTogTW9uc3RlcikgPT4gbnVtYmVyIHwgdW5kZWZpbmVkIHtcbiAgICAvLyBJZiB0aGVyZSdzIGEgYm9zcyBzY3JlZW4sIGV4Y2x1ZGUgaXQgZnJvbSBnZXR0aW5nIGVuZW1pZXMuXG4gICAgY29uc3QgYm9zcyA9IHRoaXMuZGF0YS5ib3NzU2NyZWVuO1xuICAgIC8vIFN0YXJ0IHdpdGggbGlzdCBvZiByZWFjaGFibGUgdGlsZXMuXG4gICAgY29uc3QgcmVhY2hhYmxlID0gdGhpcy5yZWFjaGFibGVUaWxlcyhmYWxzZSk7XG4gICAgLy8gRG8gYSBicmVhZHRoLWZpcnN0IHNlYXJjaCBvZiBhbGwgdGlsZXMgdG8gZmluZCBcImRpc3RhbmNlXCIgKDEtbm9ybSkuXG4gICAgY29uc3QgZXh0ZW5kZWQgPSBuZXcgTWFwPG51bWJlciwgbnVtYmVyPihbLi4ucmVhY2hhYmxlLmtleXMoKV0ubWFwKHggPT4gW3gsIDBdKSk7XG4gICAgY29uc3Qgbm9ybWFsOiBudW1iZXJbXSA9IFtdOyAvLyByZWFjaGFibGUsIG5vdCBzbG9wZSBvciB3YXRlclxuICAgIGNvbnN0IG1vdGhzOiBudW1iZXJbXSA9IFtdOyAgLy8gZGlzdGFuY2Ug4oiIIDMuLjdcbiAgICBjb25zdCBiaXJkczogbnVtYmVyW10gPSBbXTsgIC8vIGRpc3RhbmNlID4gMTJcbiAgICBjb25zdCBwbGFudHM6IG51bWJlcltdID0gW107IC8vIGRpc3RhbmNlIOKIiCAyLi40XG4gICAgY29uc3QgcGxhY2VkOiBBcnJheTxbTW9uc3RlciwgbnVtYmVyLCBudW1iZXIsIG51bWJlcl0+ID0gW107XG4gICAgY29uc3Qgbm9ybWFsVGVycmFpbk1hc2sgPSB0aGlzLmhhc0RvbHBoaW4oKSA/IDB4MjUgOiAweDI3O1xuICAgIGZvciAoY29uc3QgW3QsIGRpc3RhbmNlXSBvZiBleHRlbmRlZCkge1xuICAgICAgY29uc3Qgc2NyID0gdGhpcy5zY3JlZW5zW3QgPj4+IDEyXVsodCA+Pj4gOCkgJiAweGZdO1xuICAgICAgaWYgKHNjciA9PT0gYm9zcykgY29udGludWU7XG4gICAgICBmb3IgKGNvbnN0IG4gb2YgbmVpZ2hib3JzKHQsIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0KSkge1xuICAgICAgICBpZiAoZXh0ZW5kZWQuaGFzKG4pKSBjb250aW51ZTtcbiAgICAgICAgZXh0ZW5kZWQuc2V0KG4sIGRpc3RhbmNlICsgMSk7XG4gICAgICB9XG4gICAgICBpZiAoIWRpc3RhbmNlICYmICEocmVhY2hhYmxlLmdldCh0KSEgJiBub3JtYWxUZXJyYWluTWFzaykpIG5vcm1hbC5wdXNoKHQpO1xuICAgICAgaWYgKHRoaXMuaWQgPT09IDB4MWEpIHtcbiAgICAgICAgLy8gU3BlY2lhbC1jYXNlIHRoZSBzd2FtcCBmb3IgcGxhbnQgcGxhY2VtZW50XG4gICAgICAgIGlmICh0aGlzLnJvbS5zY3JlZW5zW3Njcl0udGlsZXNbdCAmIDB4ZmZdID09PSAweGYwKSBwbGFudHMucHVzaCh0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChkaXN0YW5jZSA+PSAyICYmIGRpc3RhbmNlIDw9IDQpIHBsYW50cy5wdXNoKHQpO1xuICAgICAgfVxuICAgICAgaWYgKGRpc3RhbmNlID49IDMgJiYgZGlzdGFuY2UgPD0gNykgbW90aHMucHVzaCh0KTtcbiAgICAgIGlmIChkaXN0YW5jZSA+PSAxMikgYmlyZHMucHVzaCh0KTtcbiAgICAgIC8vIFRPRE8gLSBzcGVjaWFsLWNhc2Ugc3dhbXAgZm9yIHBsYW50IGxvY2F0aW9ucz9cbiAgICB9XG4gICAgLy8gV2Ugbm93IGtub3cgYWxsIHRoZSBwb3NzaWJsZSBwbGFjZXMgdG8gcGxhY2UgdGhpbmdzLlxuICAgIC8vICAtIE5PVEU6IHN0aWxsIG5lZWQgdG8gbW92ZSBjaGVzdHMgdG8gZGVhZCBlbmRzLCBldGM/XG4gICAgcmV0dXJuIChtOiBNb25zdGVyKSA9PiB7XG4gICAgICAvLyBjaGVjayBmb3IgcGxhY2VtZW50LlxuICAgICAgY29uc3QgcGxhY2VtZW50ID0gbS5wbGFjZW1lbnQoKTtcbiAgICAgIGNvbnN0IHBvb2wgPSBbLi4uKHBsYWNlbWVudCA9PT0gJ25vcm1hbCcgPyBub3JtYWwgOlxuICAgICAgICAgICAgICAgICAgICAgICAgcGxhY2VtZW50ID09PSAnbW90aCcgPyBtb3RocyA6XG4gICAgICAgICAgICAgICAgICAgICAgICBwbGFjZW1lbnQgPT09ICdiaXJkJyA/IGJpcmRzIDpcbiAgICAgICAgICAgICAgICAgICAgICAgIHBsYWNlbWVudCA9PT0gJ3BsYW50JyA/IHBsYW50cyA6XG4gICAgICAgICAgICAgICAgICAgICAgICBhc3NlcnROZXZlcihwbGFjZW1lbnQpKV1cbiAgICAgIFBPT0w6XG4gICAgICB3aGlsZSAocG9vbC5sZW5ndGgpIHtcbiAgICAgICAgY29uc3QgaSA9IHJhbmRvbS5uZXh0SW50KHBvb2wubGVuZ3RoKTtcbiAgICAgICAgY29uc3QgW3Bvc10gPSBwb29sLnNwbGljZShpLCAxKTtcblxuICAgICAgICBjb25zdCB4ID0gKHBvcyAmIDB4ZjAwKSA+Pj4gNCB8IChwb3MgJiAweGYpO1xuICAgICAgICBjb25zdCB5ID0gKHBvcyAmIDB4ZjAwMCkgPj4+IDggfCAocG9zICYgMHhmMCkgPj4+IDQ7XG4gICAgICAgIGNvbnN0IHIgPSBtLmNsZWFyYW5jZSgpO1xuXG4gICAgICAgIC8vIHRlc3QgZGlzdGFuY2UgZnJvbSBvdGhlciBlbmVtaWVzLlxuICAgICAgICBmb3IgKGNvbnN0IFssIHgxLCB5MSwgcjFdIG9mIHBsYWNlZCkge1xuICAgICAgICAgIGNvbnN0IHoyID0gKCh5IC0geTEpICoqIDIgKyAoeCAtIHgxKSAqKiAyKTtcbiAgICAgICAgICBpZiAoejIgPCAociArIHIxKSAqKiAyKSBjb250aW51ZSBQT09MO1xuICAgICAgICB9XG4gICAgICAgIC8vIHRlc3QgZGlzdGFuY2UgZnJvbSBlbnRyYW5jZXMuXG4gICAgICAgIGZvciAoY29uc3Qge3g6IHgxLCB5OiB5MSwgdXNlZH0gb2YgdGhpcy5lbnRyYW5jZXMpIHtcbiAgICAgICAgICBpZiAoIXVzZWQpIGNvbnRpbnVlO1xuICAgICAgICAgIGNvbnN0IHoyID0gKCh5IC0gKHkxID4+IDQpKSAqKiAyICsgKHggLSAoeDEgPj4gNCkpICoqIDIpO1xuICAgICAgICAgIGlmICh6MiA8IChyICsgMSkgKiogMikgY29udGludWUgUE9PTDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFZhbGlkIHNwb3QgKHN0aWxsLCBob3cgdG9hIGFwcHJveGltYXRlbHkgKm1heGltaXplKiBkaXN0YW5jZXM/KVxuICAgICAgICBwbGFjZWQucHVzaChbbSwgeCwgeSwgcl0pO1xuICAgICAgICBjb25zdCBzY3IgPSAoeSAmIDB4ZjApIHwgKHggJiAweGYwKSA+Pj4gNDtcbiAgICAgICAgY29uc3QgdGlsZSA9ICh5ICYgMHgwZikgPDwgNCB8ICh4ICYgMHgwZik7XG4gICAgICAgIHJldHVybiBzY3IgPDwgOCB8IHRpbGU7XG4gICAgICB9XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgfVxuICAvLyBUT0RPIC0gYWxsb3cgbGVzcyByYW5kb21uZXNzIGZvciBjZXJ0YWluIGNhc2VzLCBlLmcuIHRvcCBvZiBub3J0aCBzYWJyZSBvclxuICAvLyBhcHByb3ByaWF0ZSBzaWRlIG9mIGNvcmRlbC5cblxuICAvKiogQHJldHVybiB7IVNldDxudW1iZXI+fSAqL1xuICAvLyBhbGxUaWxlcygpIHtcbiAgLy8gICBjb25zdCB0aWxlcyA9IG5ldyBTZXQoKTtcbiAgLy8gICBmb3IgKGNvbnN0IHNjcmVlbiBvZiB0aGlzLnNjcmVlbnMpIHtcbiAgLy8gICAgIGZvciAoY29uc3QgdGlsZSBvZiBzY3JlZW4uYWxsVGlsZXMoKSkge1xuICAvLyAgICAgICB0aWxlcy5hZGQodGlsZSk7XG4gIC8vICAgICB9XG4gIC8vICAgfVxuICAvLyAgIHJldHVybiB0aWxlcztcbiAgLy8gfVxuXG4gIC8vIFRPRE8gLSB1c2UgbWV0YXNjcmVlbiBmb3IgdGhpcyBsYXRlclxuICByZXNpemVTY3JlZW5zKHRvcDogbnVtYmVyLCBsZWZ0OiBudW1iZXIsIGJvdHRvbTogbnVtYmVyLCByaWdodDogbnVtYmVyKSB7XG4gICAgY29uc3QgbmV3V2lkdGggPSB0aGlzLndpZHRoICsgbGVmdCArIHJpZ2h0O1xuICAgIGNvbnN0IG5ld0hlaWdodCA9IHRoaXMuaGVpZ2h0ICsgdG9wICsgYm90dG9tO1xuICAgIGNvbnN0IG5ld1NjcmVlbnMgPSBBcnJheS5mcm9tKHtsZW5ndGg6IG5ld0hlaWdodH0sIChfLCB5KSA9PiB7XG4gICAgICB5IC09IHRvcDtcbiAgICAgIHJldHVybiBBcnJheS5mcm9tKHtsZW5ndGg6IG5ld1dpZHRofSwgKF8sIHgpID0+IHtcbiAgICAgICAgeCAtPSBsZWZ0O1xuICAgICAgICBpZiAoeSA8IDAgfHwgeCA8IDAgfHwgeSA+PSB0aGlzLmhlaWdodCB8fCB4ID49IHRoaXMud2lkdGgpIHJldHVybiAwO1xuICAgICAgICByZXR1cm4gdGhpcy5zY3JlZW5zW3ldW3hdO1xuICAgICAgfSk7XG4gICAgfSk7XG4gICAgdGhpcy53aWR0aCA9IG5ld1dpZHRoO1xuICAgIHRoaXMuaGVpZ2h0ID0gbmV3SGVpZ2h0O1xuICAgIHRoaXMuc2NyZWVucyA9IG5ld1NjcmVlbnM7XG4gICAgLy8gVE9ETyAtIGlmIGFueSBvZiB0aGVzZSBnbyBuZWdhdGl2ZSwgd2UncmUgaW4gdHJvdWJsZS4uLlxuICAgIC8vIFByb2JhYmx5IHRoZSBiZXN0IGJldCB3b3VsZCBiZSB0byBwdXQgYSBjaGVjayBpbiB0aGUgc2V0dGVyP1xuICAgIGZvciAoY29uc3QgZiBvZiB0aGlzLmZsYWdzKSB7XG4gICAgICBmLnhzICs9IGxlZnQ7XG4gICAgICBmLnlzICs9IHRvcDtcbiAgICB9XG4gICAgZm9yIChjb25zdCBwIG9mIHRoaXMucGl0cykge1xuICAgICAgcC5mcm9tWHMgKz0gbGVmdDtcbiAgICAgIHAuZnJvbVlzICs9IHRvcDtcbiAgICB9XG4gICAgZm9yIChjb25zdCBzIG9mIFsuLi50aGlzLnNwYXducywgLi4udGhpcy5leGl0c10pIHtcbiAgICAgIHMueHQgKz0gMTYgKiBsZWZ0O1xuICAgICAgcy55dCArPSAxNiAqIHRvcDtcbiAgICB9XG4gICAgZm9yIChjb25zdCBlIG9mIHRoaXMuZW50cmFuY2VzKSB7XG4gICAgICBpZiAoIWUudXNlZCkgY29udGludWU7XG4gICAgICBlLnggKz0gMjU2ICogbGVmdDtcbiAgICAgIGUueSArPSAyNTYgKiB0b3A7XG4gICAgfVxuICB9XG5cbiAgd3JpdGVTY3JlZW5zMmQoc3RhcnQ6IG51bWJlcixcbiAgICAgICAgICAgICAgICAgZGF0YTogUmVhZG9ubHlBcnJheTxSZWFkb25seUFycmF5PG51bWJlciB8IG51bGw+Pikge1xuICAgIGNvbnN0IHgwID0gc3RhcnQgJiAweGY7XG4gICAgY29uc3QgeTAgPSBzdGFydCA+Pj4gNDtcbiAgICBmb3IgKGxldCB5ID0gMDsgeSA8IGRhdGEubGVuZ3RoOyB5KyspIHtcbiAgICAgIGNvbnN0IHJvdyA9IGRhdGFbeV07XG4gICAgICBmb3IgKGxldCB4ID0gMDsgeCA8IHJvdy5sZW5ndGg7IHgrKykge1xuICAgICAgICBjb25zdCB0aWxlID0gcm93W3hdO1xuICAgICAgICBpZiAodGlsZSAhPSBudWxsKSB0aGlzLnNjcmVlbnNbeTAgKyB5XVt4MCArIHhdID0gdGlsZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBDb25uZWN0IHR3byBzY3JlZW5zIHZpYSBlbnRyYW5jZXMuXG4gIC8vIEFzc3VtZXMgZXhpdHMgYW5kIGVudHJhbmNlcyBhcmUgY29tcGxldGVseSBhYnNlbnQuXG4gIC8vIFNjcmVlbiBJRHMgbXVzdCBiZSBpbiBzY3JlZW5FeGl0cy5cbiAgY29ubmVjdChwb3M6IG51bWJlciwgdGhhdDogTG9jYXRpb24sIHRoYXRQb3M6IG51bWJlcikge1xuICAgIGNvbnN0IHRoaXNZID0gcG9zID4+PiA0O1xuICAgIGNvbnN0IHRoaXNYID0gcG9zICYgMHhmO1xuICAgIGNvbnN0IHRoYXRZID0gdGhhdFBvcyA+Pj4gNDtcbiAgICBjb25zdCB0aGF0WCA9IHRoYXRQb3MgJiAweGY7XG4gICAgY29uc3QgdGhpc1RpbGUgPSB0aGlzLnNjcmVlbnNbdGhpc1ldW3RoaXNYXTtcbiAgICBjb25zdCB0aGF0VGlsZSA9IHRoYXQuc2NyZWVuc1t0aGF0WV1bdGhhdFhdO1xuICAgIGNvbnN0IFt0aGlzRW50cmFuY2UsIHRoaXNFeGl0c10gPSBzY3JlZW5FeGl0c1t0aGlzVGlsZV07XG4gICAgY29uc3QgW3RoYXRFbnRyYW5jZSwgdGhhdEV4aXRzXSA9IHNjcmVlbkV4aXRzW3RoYXRUaWxlXTtcbiAgICBjb25zdCB0aGlzRW50cmFuY2VJbmRleCA9IHRoaXMuZW50cmFuY2VzLmxlbmd0aDtcbiAgICBjb25zdCB0aGF0RW50cmFuY2VJbmRleCA9IHRoYXQuZW50cmFuY2VzLmxlbmd0aDtcbiAgICB0aGlzLmVudHJhbmNlcy5wdXNoKEVudHJhbmNlLm9mKHt5OiB0aGlzWSA8PCA4IHwgdGhpc0VudHJhbmNlID4+PiA4LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHg6IHRoaXNYIDw8IDggfCB0aGlzRW50cmFuY2UgJiAweGZmfSkpO1xuICAgIHRoYXQuZW50cmFuY2VzLnB1c2goRW50cmFuY2Uub2Yoe3k6IHRoYXRZIDw8IDggfCB0aGF0RW50cmFuY2UgPj4+IDgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeDogdGhhdFggPDwgOCB8IHRoYXRFbnRyYW5jZSAmIDB4ZmZ9KSk7XG4gICAgZm9yIChjb25zdCBleGl0IG9mIHRoaXNFeGl0cykge1xuICAgICAgdGhpcy5leGl0cy5wdXNoKEV4aXQub2Yoe3NjcmVlbjogcG9zLCB0aWxlOiBleGl0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc3Q6IHRoYXQuaWQsIGVudHJhbmNlOiB0aGF0RW50cmFuY2VJbmRleH0pKTtcbiAgICB9XG4gICAgZm9yIChjb25zdCBleGl0IG9mIHRoYXRFeGl0cykge1xuICAgICAgdGhhdC5leGl0cy5wdXNoKEV4aXQub2Yoe3NjcmVlbjogdGhhdFBvcywgdGlsZTogZXhpdCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXN0OiB0aGlzLmlkLCBlbnRyYW5jZTogdGhpc0VudHJhbmNlSW5kZXh9KSk7XG4gICAgfVxuICB9XG5cbiAgbmVpZ2hib3JGb3JFbnRyYW5jZShlbnRyYW5jZUlkOiBudW1iZXIpOiBMb2NhdGlvbiB7XG4gICAgY29uc3QgZW50cmFuY2UgPSB0aGlzLmVudHJhbmNlc1tlbnRyYW5jZUlkXTtcbiAgICBpZiAoIWVudHJhbmNlKSB0aHJvdyBuZXcgRXJyb3IoYG5vIGVudHJhbmNlICR7aGV4KHRoaXMuaWQpfToke2VudHJhbmNlSWR9YCk7XG4gICAgZm9yIChjb25zdCBleGl0IG9mIHRoaXMuZXhpdHMpIHtcbiAgICAgIGlmIChleGl0LnNjcmVlbiAhPT0gZW50cmFuY2Uuc2NyZWVuKSBjb250aW51ZTtcbiAgICAgIGNvbnN0IGR4ID0gTWF0aC5hYnMoZXhpdC54IC0gZW50cmFuY2UueCk7XG4gICAgICBjb25zdCBkeSA9IE1hdGguYWJzKGV4aXQueSAtIGVudHJhbmNlLnkpO1xuICAgICAgaWYgKGR4IDwgMjQgJiYgZHkgPCAyNCkgcmV0dXJuIHRoaXMucm9tLmxvY2F0aW9uc1tleGl0LmRlc3RdO1xuICAgIH1cbiAgICB0aHJvdyBuZXcgRXJyb3IoYG5vIGV4aXQgZm91bmQgbmVhciAke2hleCh0aGlzLmlkKX06JHtlbnRyYW5jZUlkfWApO1xuICB9XG59XG5cbi8vIFRPRE8gLSBtb3ZlIHRvIGEgYmV0dGVyLW9yZ2FuaXplZCBkZWRpY2F0ZWQgXCJnZW9tZXRyeVwiIG1vZHVsZT9cbmZ1bmN0aW9uIG5laWdoYm9ycyh0aWxlOiBudW1iZXIsIHdpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyKTogbnVtYmVyW10ge1xuICBjb25zdCBvdXQgPSBbXTtcbiAgY29uc3QgeSA9IHRpbGUgJiAweGYwZjA7XG4gIGNvbnN0IHggPSB0aWxlICYgMHgwZjBmO1xuICBpZiAoeSA8ICgoaGVpZ2h0IC0gMSkgPDwgMTIgfCAweGUwKSkge1xuICAgIG91dC5wdXNoKCh0aWxlICYgMHhmMCkgPT09IDB4ZTAgPyB0aWxlICsgMHgwZjIwIDogdGlsZSArIDE2KTtcbiAgfVxuICBpZiAoeSkge1xuICAgIG91dC5wdXNoKCh0aWxlICYgMHhmMCkgPT09IDB4MDAgPyB0aWxlIC0gMHgwZjIwIDogdGlsZSAtIDE2KTtcbiAgfVxuICBpZiAoeCA8ICgod2lkdGggLSAxKSA8PCA4IHwgMHgwZikpIHtcbiAgICBvdXQucHVzaCgodGlsZSAmIDB4MGYpID09PSAweDBmID8gdGlsZSArIDB4MDBmMSA6IHRpbGUgKyAxKTtcbiAgfVxuICBpZiAoeCkge1xuICAgIG91dC5wdXNoKCh0aWxlICYgMHgwZikgPT09IDB4MDAgPyB0aWxlIC0gMHgwMGYxIDogdGlsZSAtIDEpO1xuICB9XG4gIHJldHVybiBvdXQ7XG59XG5cbmV4cG9ydCBjb25zdCBFbnRyYW5jZSA9IERhdGFUdXBsZS5tYWtlKDQsIHtcbiAgeDogRGF0YVR1cGxlLnByb3AoWzBdLCBbMSwgMHhmZiwgLThdKSxcbiAgeTogRGF0YVR1cGxlLnByb3AoWzJdLCBbMywgMHhmZiwgLThdKSxcblxuICBzY3JlZW46IERhdGFUdXBsZS5wcm9wKFszLCAweDBmLCAtNF0sIFsxLCAweDBmXSksXG4gIHRpbGU6ICAgRGF0YVR1cGxlLnByb3AoWzIsIDB4ZjBdLCBbMCwgMHhmMCwgNF0pLFxuICBjb29yZDogIERhdGFUdXBsZS5wcm9wKFsyLCAweGZmLCAtOF0sIFswLCAweGZmXSksXG5cbiAgdXNlZDoge1xuICAgIGdldCh0aGlzOiBhbnkpOiBib29sZWFuIHsgcmV0dXJuIHRoaXMuZGF0YVsxXSAhPSAweGZmOyB9LFxuICB9LFxuXG4gIHRvU3RyaW5nKHRoaXM6IGFueSk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGBFbnRyYW5jZSAke3RoaXMuaGV4KCl9OiAoJHtoZXgodGhpcy54KX0sICR7aGV4KHRoaXMueSl9KWA7XG4gIH0sXG59KTtcbmV4cG9ydCB0eXBlIEVudHJhbmNlID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBFbnRyYW5jZT47XG5cbmV4cG9ydCBjb25zdCBFeGl0ID0gRGF0YVR1cGxlLm1ha2UoNCwge1xuICB4OiAgICAgICAgRGF0YVR1cGxlLnByb3AoWzAsIDB4ZmYsIC00XSksXG4gIHh0OiAgICAgICBEYXRhVHVwbGUucHJvcChbMF0pLFxuXG4gIHk6ICAgICAgICBEYXRhVHVwbGUucHJvcChbMSwgMHhmZiwgLTRdKSxcbiAgeXQ6ICAgICAgIERhdGFUdXBsZS5wcm9wKFsxXSksXG5cbiAgc2NyZWVuOiAgIERhdGFUdXBsZS5wcm9wKFsxLCAweGYwXSwgWzAsIDB4ZjAsIDRdKSxcbiAgdGlsZTogICAgIERhdGFUdXBsZS5wcm9wKFsxLCAweDBmLCAtNF0sIFswLCAweDBmXSksXG5cbiAgZGVzdDogICAgIERhdGFUdXBsZS5wcm9wKFsyXSksXG5cbiAgZW50cmFuY2U6IERhdGFUdXBsZS5wcm9wKFszXSksXG5cbiAgdG9TdHJpbmcodGhpczogYW55KTogc3RyaW5nIHtcbiAgICByZXR1cm4gYEV4aXQgJHt0aGlzLmhleCgpfTogKCR7aGV4KHRoaXMueCl9LCAke2hleCh0aGlzLnkpfSkgPT4gJHtcbiAgICAgICAgICAgIHRoaXMuZGVzdH06JHt0aGlzLmVudHJhbmNlfWA7XG4gIH0sXG59KTtcbmV4cG9ydCB0eXBlIEV4aXQgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIEV4aXQ+O1xuXG5leHBvcnQgY29uc3QgRmxhZyA9IERhdGFUdXBsZS5tYWtlKDIsIHtcbiAgZmxhZzogIHtcbiAgICBnZXQodGhpczogYW55KTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuZGF0YVswXSB8IDB4MjAwOyB9LFxuICAgIHNldCh0aGlzOiBhbnksIGY6IG51bWJlcikge1xuICAgICAgaWYgKChmICYgfjB4ZmYpICE9PSAweDIwMCkgdGhyb3cgbmV3IEVycm9yKGBiYWQgZmxhZzogJHtoZXgoZil9YCk7XG4gICAgICB0aGlzLmRhdGFbMF0gPSBmICYgMHhmZjtcbiAgICB9LFxuICB9LFxuXG4gIHg6ICAgICBEYXRhVHVwbGUucHJvcChbMSwgMHgwNywgLThdKSxcbiAgeHM6ICAgIERhdGFUdXBsZS5wcm9wKFsxLCAweDA3XSksXG5cbiAgeTogICAgIERhdGFUdXBsZS5wcm9wKFsxLCAweGYwLCAtNF0pLFxuICB5czogICAgRGF0YVR1cGxlLnByb3AoWzEsIDB4ZjAsIDRdKSxcblxuICAvLyBUT0RPIC0gcmVtb3ZlIHRoZSAneXgnIHZlcnNpb25cbiAgeXg6ICAgIERhdGFUdXBsZS5wcm9wKFsxXSksIC8vIHkgaW4gaGkgbmliYmxlLCB4IGluIGxvLlxuICBzY3JlZW46IERhdGFUdXBsZS5wcm9wKFsxXSksXG5cbiAgdG9TdHJpbmcodGhpczogYW55KTogc3RyaW5nIHtcbiAgICByZXR1cm4gYEZsYWcgJHt0aGlzLmhleCgpfTogKCR7aGV4KHRoaXMueHMpfSwgJHtoZXgodGhpcy55cyl9KSBAICR7XG4gICAgICAgICAgICBoZXgodGhpcy5mbGFnKX1gO1xuICB9LFxufSk7XG5leHBvcnQgdHlwZSBGbGFnID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBGbGFnPjtcblxuZXhwb3J0IGNvbnN0IFBpdCA9IERhdGFUdXBsZS5tYWtlKDQsIHtcbiAgZnJvbVhzOiAgRGF0YVR1cGxlLnByb3AoWzEsIDB4NzAsIDRdKSxcbiAgdG9YczogICAgRGF0YVR1cGxlLnByb3AoWzEsIDB4MDddKSxcblxuICBmcm9tWXM6ICBEYXRhVHVwbGUucHJvcChbMywgMHhmMCwgNF0pLFxuICB0b1lzOiAgICBEYXRhVHVwbGUucHJvcChbMywgMHgwZl0pLFxuXG4gIGRlc3Q6ICAgIERhdGFUdXBsZS5wcm9wKFswXSksXG5cbiAgdG9TdHJpbmcodGhpczogYW55KTogc3RyaW5nIHtcbiAgICByZXR1cm4gYFBpdCAke3RoaXMuaGV4KCl9OiAoJHtoZXgodGhpcy5mcm9tWHMpfSwgJHtoZXgodGhpcy5mcm9tWXMpfSkgPT4gJHtcbiAgICAgICAgICAgIGhleCh0aGlzLmRlc3QpfTooJHtoZXgodGhpcy50b1hzKX0sICR7aGV4KHRoaXMudG9Zcyl9KWA7XG4gIH0sXG59KTtcbmV4cG9ydCB0eXBlIFBpdCA9IEluc3RhbmNlVHlwZTx0eXBlb2YgUGl0PjtcblxuZXhwb3J0IGNvbnN0IFNwYXduID0gRGF0YVR1cGxlLm1ha2UoNCwge1xuICB5OiAgICAgRGF0YVR1cGxlLnByb3AoWzAsIDB4ZmYsIC00XSksXG4gIHl0OiAgICBEYXRhVHVwbGUucHJvcChbMF0pLFxuXG4gIHRpbWVkOiBEYXRhVHVwbGUuYm9vbGVhblByb3AoWzEsIDB4ODAsIDddKSxcbiAgeDogICAgIERhdGFUdXBsZS5wcm9wKFsxLCAweDdmLCAtNF0sIFsyLCAweDQwLCAzXSksXG4gIHh0OiAgICBEYXRhVHVwbGUucHJvcChbMSwgMHg3Zl0pLFxuXG4gIHNjcmVlbjogRGF0YVR1cGxlLnByb3AoWzAsIDB4ZjBdLCBbMSwgMHg3MCwgNF0pLFxuICB0aWxlOiAgIERhdGFUdXBsZS5wcm9wKFswLCAweDBmLCAtNF0sIFsxLCAweDBmXSksXG5cbiAgcGF0dGVybkJhbms6IERhdGFUdXBsZS5wcm9wKFsyLCAweDgwLCA3XSksXG4gIHR5cGU6ICBEYXRhVHVwbGUucHJvcChbMiwgMHgwN10pLFxuXG4vLyBwYXR0ZXJuQmFuazoge2dldCh0aGlzOiBhbnkpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5kYXRhWzJdID4+PiA3OyB9LFxuLy8gICAgICAgICAgICAgICBzZXQodGhpczogYW55LCB2OiBudW1iZXIpIHsgaWYgKHRoaXMuZGF0YVszXSA9PT0gMTIwKSBkZWJ1Z2dlcjtcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2KSB0aGlzLmRhdGFbMl0gfD0gMHg4MDsgZWxzZSB0aGlzLmRhdGFbMl0gJj0gMHg3ZjsgfX0sXG4gIGlkOiAgICBEYXRhVHVwbGUucHJvcChbM10pLFxuXG4gIHVzZWQ6IHtnZXQodGhpczogYW55KTogYm9vbGVhbiB7IHJldHVybiB0aGlzLmRhdGFbMF0gIT09IDB4ZmU7IH0sXG4gICAgICAgICBzZXQodGhpczogYW55LCB1c2VkOiBib29sZWFuKSB7IHRoaXMuZGF0YVswXSA9IHVzZWQgPyAwIDogMHhmZTsgfX0sXG4gIG1vbnN0ZXJJZDoge2dldCh0aGlzOiBhbnkpOiBudW1iZXIgeyByZXR1cm4gKHRoaXMuaWQgKyAweDUwKSAmIDB4ZmY7IH0sXG4gICAgICAgICAgICAgIHNldCh0aGlzOiBhbnksIGlkOiBudW1iZXIpIHsgdGhpcy5pZCA9IChpZCAtIDB4NTApICYgMHhmZjsgfX0sXG4gIC8qKiBOb3RlOiB0aGlzIGluY2x1ZGVzIG1pbWljcy4gKi9cbiAgaXNDaGVzdCh0aGlzOiBhbnkpOiBib29sZWFuIHsgcmV0dXJuIHRoaXMudHlwZSA9PT0gMiAmJiB0aGlzLmlkIDwgMHg4MDsgfSxcbiAgaXNJbnZpc2libGUodGhpczogYW55KTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuaXNDaGVzdCgpICYmIEJvb2xlYW4odGhpcy5kYXRhWzJdICYgMHgyMCk7XG4gIH0sXG4gIGlzVHJpZ2dlcih0aGlzOiBhbnkpOiBib29sZWFuIHsgcmV0dXJuIHRoaXMudHlwZSA9PT0gMiAmJiB0aGlzLmlkID49IDB4ODA7IH0sXG4gIGlzTnBjKHRoaXM6IGFueSk6IGJvb2xlYW4geyByZXR1cm4gdGhpcy50eXBlID09PSAxICYmIHRoaXMuaWQgPCAweGMwOyB9LFxuICBpc0Jvc3ModGhpczogYW55KTogYm9vbGVhbiB7IHJldHVybiB0aGlzLnR5cGUgPT09IDEgJiYgdGhpcy5pZCA+PSAweGMwOyB9LFxuICBpc01vbnN0ZXIodGhpczogYW55KTogYm9vbGVhbiB7IHJldHVybiB0aGlzLnR5cGUgPT09IDA7IH0sXG4gIGlzV2FsbCh0aGlzOiBhbnkpOiBib29sZWFuIHtcbiAgICByZXR1cm4gQm9vbGVhbih0aGlzLnR5cGUgPT09IDMgJiYgKHRoaXMuaWQgPCA0IHx8ICh0aGlzLmRhdGFbMl0gJiAweDIwKSkpO1xuICB9LFxuICBpc1Nob290aW5nV2FsbCh0aGlzOiBhbnksIGxvY2F0aW9uOiBMb2NhdGlvbik6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmlzV2FsbCgpICYmXG4gICAgICAgICEhKHRoaXMuZGF0YVsyXSAmIDB4MjAgPyB0aGlzLmRhdGFbMl0gJiAweDEwIDpcbiAgICAgICAgICAgbG9jYXRpb24uaWQgPT09IDB4OGYgfHwgbG9jYXRpb24uaWQgPT09IDB4YTgpO1xuICB9LFxuICB3YWxsVHlwZSh0aGlzOiBhbnkpOiAnJyB8ICd3YWxsJyB8ICdicmlkZ2UnIHtcbiAgICBpZiAodGhpcy50eXBlICE9PSAzKSByZXR1cm4gJyc7XG4gICAgY29uc3Qgb2JqID0gdGhpcy5kYXRhWzJdICYgMHgyMCA/IHRoaXMuaWQgPj4+IDQgOiB0aGlzLmlkO1xuICAgIGlmIChvYmogPj0gNCkgcmV0dXJuICcnO1xuICAgIHJldHVybiBvYmogPT09IDIgPyAnYnJpZGdlJyA6ICd3YWxsJztcbiAgfSxcbiAgd2FsbEVsZW1lbnQodGhpczogYW55KTogbnVtYmVyIHtcbiAgICBpZiAoIXRoaXMuaXNXYWxsKCkpIHJldHVybiAtMTtcbiAgICByZXR1cm4gdGhpcy5pZCAmIDM7XG4gIH0sXG4gIHRvU3RyaW5nKHRoaXM6IGFueSk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGBTcGF3biAke3RoaXMuaGV4KCl9OiAoJHtoZXgodGhpcy54KX0sICR7aGV4KHRoaXMueSl9KSAke1xuICAgICAgICAgICAgdGhpcy50aW1lZCA/ICd0aW1lZCcgOiAnZml4ZWQnfSAke3RoaXMudHlwZX06JHtoZXgodGhpcy5pZCl9YDtcbiAgfSxcbn0pO1xuZXhwb3J0IHR5cGUgU3Bhd24gPSBJbnN0YW5jZVR5cGU8dHlwZW9mIFNwYXduPjtcblxuZXhwb3J0IGNvbnN0IExPQ0FUSU9OUyA9IHtcbiAgbWV6YW1lU2hyaW5lOiBbMHgwMCwgJ01lemFtZSBTaHJpbmUnXSxcbiAgbGVhZk91dHNpZGVTdGFydDogWzB4MDEsICdMZWFmIC0gT3V0c2lkZSBTdGFydCddLFxuICBsZWFmOiBbMHgwMiwgJ0xlYWYnXSxcbiAgdmFsbGV5T2ZXaW5kOiBbMHgwMywgJ1ZhbGxleSBvZiBXaW5kJ10sXG4gIHNlYWxlZENhdmUxOiBbMHgwNCwgJ1NlYWxlZCBDYXZlIDEnXSxcbiAgc2VhbGVkQ2F2ZTI6IFsweDA1LCAnU2VhbGVkIENhdmUgMiddLFxuICBzZWFsZWRDYXZlNjogWzB4MDYsICdTZWFsZWQgQ2F2ZSA2J10sXG4gIHNlYWxlZENhdmU0OiBbMHgwNywgJ1NlYWxlZCBDYXZlIDQnXSxcbiAgc2VhbGVkQ2F2ZTU6IFsweDA4LCAnU2VhbGVkIENhdmUgNSddLFxuICBzZWFsZWRDYXZlMzogWzB4MDksICdTZWFsZWQgQ2F2ZSAzJ10sXG4gIHNlYWxlZENhdmU3OiBbMHgwYSwgJ1NlYWxlZCBDYXZlIDcnXSxcbiAgLy8gSU5WQUxJRDogMHgwYlxuICBzZWFsZWRDYXZlODogWzB4MGMsICdTZWFsZWQgQ2F2ZSA4J10sXG4gIC8vIElOVkFMSUQ6IDB4MGRcbiAgd2luZG1pbGxDYXZlOiBbMHgwZSwgJ1dpbmRtaWxsIENhdmUnXSxcbiAgd2luZG1pbGw6IFsweDBmLCAnV2luZG1pbGwnXSxcbiAgemVidUNhdmU6IFsweDEwLCAnWmVidSBDYXZlJ10sXG4gIG10U2FicmVXZXN0Q2F2ZTE6IFsweDExLCAnTXQgU2FicmUgV2VzdCAtIENhdmUgMSddLFxuICAvLyBJTlZBTElEOiAweDEyXG4gIC8vIElOVkFMSUQ6IDB4MTNcbiAgY29yZGVsUGxhaW5zV2VzdDogWzB4MTQsICdDb3JkZWwgUGxhaW5zIFdlc3QnXSxcbiAgY29yZGVsUGxhaW5zRWFzdDogWzB4MTUsICdDb3JkZWwgUGxhaW5zIEVhc3QnXSxcbiAgLy8gSU5WQUxJRDogMHgxNiAtLSB1bnVzZWQgY29weSBvZiAxOFxuICAvLyBJTlZBTElEOiAweDE3XG4gIGJyeW5tYWVyOiBbMHgxOCwgJ0JyeW5tYWVyJ10sXG4gIG91dHNpZGVTdG9tSG91c2U6IFsweDE5LCAnT3V0c2lkZSBTdG9tIEhvdXNlJ10sXG4gIHN3YW1wOiBbMHgxYSwgJ1N3YW1wJ10sXG4gIGFtYXpvbmVzOiBbMHgxYiwgJ0FtYXpvbmVzJ10sXG4gIG9hazogWzB4MWMsICdPYWsnXSxcbiAgLy8gSU5WQUxJRDogMHgxZFxuICBzdG9tSG91c2U6IFsweDFlLCAnU3RvbSBIb3VzZSddLFxuICAvLyBJTlZBTElEOiAweDFmXG4gIG10U2FicmVXZXN0TG93ZXI6IFsweDIwLCAnTXQgU2FicmUgV2VzdCAtIExvd2VyJ10sXG4gIG10U2FicmVXZXN0VXBwZXI6IFsweDIxLCAnTXQgU2FicmUgV2VzdCAtIFVwcGVyJ10sXG4gIG10U2FicmVXZXN0Q2F2ZTI6IFsweDIyLCAnTXQgU2FicmUgV2VzdCAtIENhdmUgMiddLFxuICBtdFNhYnJlV2VzdENhdmUzOiBbMHgyMywgJ010IFNhYnJlIFdlc3QgLSBDYXZlIDMnXSxcbiAgbXRTYWJyZVdlc3RDYXZlNDogWzB4MjQsICdNdCBTYWJyZSBXZXN0IC0gQ2F2ZSA0J10sXG4gIG10U2FicmVXZXN0Q2F2ZTU6IFsweDI1LCAnTXQgU2FicmUgV2VzdCAtIENhdmUgNSddLFxuICBtdFNhYnJlV2VzdENhdmU2OiBbMHgyNiwgJ010IFNhYnJlIFdlc3QgLSBDYXZlIDYnXSxcbiAgbXRTYWJyZVdlc3RDYXZlNzogWzB4MjcsICdNdCBTYWJyZSBXZXN0IC0gQ2F2ZSA3J10sXG4gIG10U2FicmVOb3J0aE1haW46IFsweDI4LCAnTXQgU2FicmUgTm9ydGggLSBNYWluJ10sXG4gIG10U2FicmVOb3J0aE1pZGRsZTogWzB4MjksICdNdCBTYWJyZSBOb3J0aCAtIE1pZGRsZSddLFxuICBtdFNhYnJlTm9ydGhDYXZlMjogWzB4MmEsICdNdCBTYWJyZSBOb3J0aCAtIENhdmUgMiddLFxuICBtdFNhYnJlTm9ydGhDYXZlMzogWzB4MmIsICdNdCBTYWJyZSBOb3J0aCAtIENhdmUgMyddLFxuICBtdFNhYnJlTm9ydGhDYXZlNDogWzB4MmMsICdNdCBTYWJyZSBOb3J0aCAtIENhdmUgNCddLFxuICBtdFNhYnJlTm9ydGhDYXZlNTogWzB4MmQsICdNdCBTYWJyZSBOb3J0aCAtIENhdmUgNSddLFxuICBtdFNhYnJlTm9ydGhDYXZlNjogWzB4MmUsICdNdCBTYWJyZSBOb3J0aCAtIENhdmUgNiddLFxuICBtdFNhYnJlTm9ydGhQcmlzb25IYWxsOiBbMHgyZiwgJ010IFNhYnJlIE5vcnRoIC0gUHJpc29uIEhhbGwnXSxcbiAgbXRTYWJyZU5vcnRoTGVmdENlbGw6IFsweDMwLCAnTXQgU2FicmUgTm9ydGggLSBMZWZ0IENlbGwnXSxcbiAgbXRTYWJyZU5vcnRoTGVmdENlbGwyOiBbMHgzMSwgJ010IFNhYnJlIE5vcnRoIC0gTGVmdCBDZWxsIDInXSxcbiAgbXRTYWJyZU5vcnRoUmlnaHRDZWxsOiBbMHgzMiwgJ010IFNhYnJlIE5vcnRoIC0gUmlnaHQgQ2VsbCddLFxuICBtdFNhYnJlTm9ydGhDYXZlODogWzB4MzMsICdNdCBTYWJyZSBOb3J0aCAtIENhdmUgOCddLFxuICBtdFNhYnJlTm9ydGhDYXZlOTogWzB4MzQsICdNdCBTYWJyZSBOb3J0aCAtIENhdmUgOSddLFxuICBtdFNhYnJlTm9ydGhTdW1taXRDYXZlOiBbMHgzNSwgJ010IFNhYnJlIE5vcnRoIC0gU3VtbWl0IENhdmUnXSxcbiAgLy8gSU5WQUxJRDogMHgzNlxuICAvLyBJTlZBTElEOiAweDM3XG4gIG10U2FicmVOb3J0aENhdmUxOiBbMHgzOCwgJ010IFNhYnJlIE5vcnRoIC0gQ2F2ZSAxJ10sXG4gIG10U2FicmVOb3J0aENhdmU3OiBbMHgzOSwgJ010IFNhYnJlIE5vcnRoIC0gQ2F2ZSA3J10sXG4gIC8vIElOVkFMSUQ6IDB4M2FcbiAgLy8gSU5WQUxJRDogMHgzYlxuICBuYWRhcmVJbm46IFsweDNjLCAnTmFkYXJlIC0gSW5uJ10sXG4gIG5hZGFyZVRvb2xTaG9wOiBbMHgzZCwgJ05hZGFyZSAtIFRvb2wgU2hvcCddLFxuICBuYWRhcmVCYWNrUm9vbTogWzB4M2UsICdOYWRhcmUgLSBCYWNrIFJvb20nXSxcbiAgLy8gSU5WQUxJRDogMHgzZlxuICB3YXRlcmZhbGxWYWxsZXlOb3J0aDogWzB4NDAsICdXYXRlcmZhbGwgVmFsbGV5IE5vcnRoJ10sXG4gIHdhdGVyZmFsbFZhbGxleVNvdXRoOiBbMHg0MSwgJ1dhdGVyZmFsbCBWYWxsZXkgU291dGgnXSxcbiAgbGltZVRyZWVWYWxsZXk6IFsweDQyLCAnTGltZSBUcmVlIFZhbGxleSddLFxuICBsaW1lVHJlZUxha2U6IFsweDQzLCAnTGltZSBUcmVlIExha2UnXSxcbiAga2lyaXNhUGxhbnRDYXZlMTogWzB4NDQsICdLaXJpc2EgUGxhbnQgQ2F2ZSAxJ10sXG4gIGtpcmlzYVBsYW50Q2F2ZTI6IFsweDQ1LCAnS2lyaXNhIFBsYW50IENhdmUgMiddLFxuICBraXJpc2FQbGFudENhdmUzOiBbMHg0NiwgJ0tpcmlzYSBQbGFudCBDYXZlIDMnXSxcbiAga2lyaXNhTWVhZG93OiBbMHg0NywgJ0tpcmlzYSBNZWFkb3cnXSxcbiAgZm9nTGFtcENhdmUxOiBbMHg0OCwgJ0ZvZyBMYW1wIENhdmUgMSddLFxuICBmb2dMYW1wQ2F2ZTI6IFsweDQ5LCAnRm9nIExhbXAgQ2F2ZSAyJ10sXG4gIGZvZ0xhbXBDYXZlMzogWzB4NGEsICdGb2cgTGFtcCBDYXZlIDMnXSxcbiAgZm9nTGFtcENhdmVEZWFkRW5kOiBbMHg0YiwgJ0ZvZyBMYW1wIENhdmUgRGVhZCBFbmQnXSxcbiAgZm9nTGFtcENhdmU0OiBbMHg0YywgJ0ZvZyBMYW1wIENhdmUgNCddLFxuICBmb2dMYW1wQ2F2ZTU6IFsweDRkLCAnRm9nIExhbXAgQ2F2ZSA1J10sXG4gIGZvZ0xhbXBDYXZlNjogWzB4NGUsICdGb2cgTGFtcCBDYXZlIDYnXSxcbiAgZm9nTGFtcENhdmU3OiBbMHg0ZiwgJ0ZvZyBMYW1wIENhdmUgNyddLFxuICBwb3J0b2E6IFsweDUwLCAnUG9ydG9hJ10sXG4gIHBvcnRvYUZpc2hlcm1hbklzbGFuZDogWzB4NTEsICdQb3J0b2EgLSBGaXNoZXJtYW4gSXNsYW5kJ10sXG4gIG1lc2lhU2hyaW5lOiBbMHg1MiwgJ01lc2lhIFNocmluZSddLFxuICAvLyBJTlZBTElEOiAweDUzXG4gIHdhdGVyZmFsbENhdmUxOiBbMHg1NCwgJ1dhdGVyZmFsbCBDYXZlIDEnXSxcbiAgd2F0ZXJmYWxsQ2F2ZTI6IFsweDU1LCAnV2F0ZXJmYWxsIENhdmUgMiddLFxuICB3YXRlcmZhbGxDYXZlMzogWzB4NTYsICdXYXRlcmZhbGwgQ2F2ZSAzJ10sXG4gIHdhdGVyZmFsbENhdmU0OiBbMHg1NywgJ1dhdGVyZmFsbCBDYXZlIDQnXSxcbiAgdG93ZXJFbnRyYW5jZTogWzB4NTgsICdUb3dlciAtIEVudHJhbmNlJ10sXG4gIHRvd2VyMTogWzB4NTksICdUb3dlciAxJ10sXG4gIHRvd2VyMjogWzB4NWEsICdUb3dlciAyJ10sXG4gIHRvd2VyMzogWzB4NWIsICdUb3dlciAzJ10sXG4gIHRvd2VyT3V0c2lkZU1lc2lhOiBbMHg1YywgJ1Rvd2VyIC0gT3V0c2lkZSBNZXNpYSddLFxuICB0b3dlck91dHNpZGVEeW5hOiBbMHg1ZCwgJ1Rvd2VyIC0gT3V0c2lkZSBEeW5hJ10sXG4gIHRvd2VyTWVzaWE6IFsweDVlLCAnVG93ZXIgLSBNZXNpYSddLFxuICB0b3dlckR5bmE6IFsweDVmLCAnVG93ZXIgLSBEeW5hJ10sXG4gIGFuZ3J5U2VhOiBbMHg2MCwgJ0FuZ3J5IFNlYSddLFxuICBib2F0SG91c2U6IFsweDYxLCAnQm9hdCBIb3VzZSddLFxuICBqb2VsTGlnaHRob3VzZTogWzB4NjIsICdKb2VsIC0gTGlnaHRob3VzZSddLFxuICAvLyBJTlZBTElEOiAweDYzXG4gIHVuZGVyZ3JvdW5kQ2hhbm5lbDogWzB4NjQsICdVbmRlcmdyb3VuZCBDaGFubmVsJ10sXG4gIHpvbWJpZVRvd246IFsweDY1LCAnWm9tYmllIFRvd24nXSxcbiAgLy8gSU5WQUxJRDogMHg2NlxuICAvLyBJTlZBTElEOiAweDY3XG4gIGV2aWxTcGlyaXRJc2xhbmQxOiBbMHg2OCwgJ0V2aWwgU3Bpcml0IElzbGFuZCAxJ10sXG4gIGV2aWxTcGlyaXRJc2xhbmQyOiBbMHg2OSwgJ0V2aWwgU3Bpcml0IElzbGFuZCAyJ10sXG4gIGV2aWxTcGlyaXRJc2xhbmQzOiBbMHg2YSwgJ0V2aWwgU3Bpcml0IElzbGFuZCAzJ10sXG4gIGV2aWxTcGlyaXRJc2xhbmQ0OiBbMHg2YiwgJ0V2aWwgU3Bpcml0IElzbGFuZCA0J10sXG4gIHNhYmVyYVBhbGFjZTE6IFsweDZjLCAnU2FiZXJhIFBhbGFjZSAxJ10sXG4gIHNhYmVyYVBhbGFjZTI6IFsweDZkLCAnU2FiZXJhIFBhbGFjZSAyJ10sXG4gIHNhYmVyYVBhbGFjZTM6IFsweDZlLCAnU2FiZXJhIFBhbGFjZSAzJ10sXG4gIC8vIElOVkFMSUQ6IDB4NmYgLS0gU2FiZXJhIFBhbGFjZSAzIHVudXNlZCBjb3B5XG4gIGpvZWxTZWNyZXRQYXNzYWdlOiBbMHg3MCwgJ0pvZWwgLSBTZWNyZXQgUGFzc2FnZSddLFxuICBqb2VsOiBbMHg3MSwgJ0pvZWwnXSxcbiAgc3dhbjogWzB4NzIsICdTd2FuJ10sXG4gIHN3YW5HYXRlOiBbMHg3MywgJ1N3YW4gLSBHYXRlJ10sXG4gIC8vIElOVkFMSUQ6IDB4NzRcbiAgLy8gSU5WQUxJRDogMHg3NVxuICAvLyBJTlZBTElEOiAweDc2XG4gIC8vIElOVkFMSUQ6IDB4NzdcbiAgZ29hVmFsbGV5OiBbMHg3OCwgJ0dvYSBWYWxsZXknXSxcbiAgLy8gSU5WQUxJRDogMHg3OVxuICAvLyBJTlZBTElEOiAweDdhXG4gIC8vIElOVkFMSUQ6IDB4N2JcbiAgbXRIeWRyYTogWzB4N2MsICdNdCBIeWRyYSddLFxuICBtdEh5ZHJhQ2F2ZTE6IFsweDdkLCAnTXQgSHlkcmEgLSBDYXZlIDEnXSxcbiAgbXRIeWRyYU91dHNpZGVTaHlyb246IFsweDdlLCAnTXQgSHlkcmEgLSBPdXRzaWRlIFNoeXJvbiddLFxuICBtdEh5ZHJhQ2F2ZTI6IFsweDdmLCAnTXQgSHlkcmEgLSBDYXZlIDInXSxcbiAgbXRIeWRyYUNhdmUzOiBbMHg4MCwgJ010IEh5ZHJhIC0gQ2F2ZSAzJ10sXG4gIG10SHlkcmFDYXZlNDogWzB4ODEsICdNdCBIeWRyYSAtIENhdmUgNCddLFxuICBtdEh5ZHJhQ2F2ZTU6IFsweDgyLCAnTXQgSHlkcmEgLSBDYXZlIDUnXSxcbiAgbXRIeWRyYUNhdmU2OiBbMHg4MywgJ010IEh5ZHJhIC0gQ2F2ZSA2J10sXG4gIG10SHlkcmFDYXZlNzogWzB4ODQsICdNdCBIeWRyYSAtIENhdmUgNyddLFxuICBtdEh5ZHJhQ2F2ZTg6IFsweDg1LCAnTXQgSHlkcmEgLSBDYXZlIDgnXSxcbiAgbXRIeWRyYUNhdmU5OiBbMHg4NiwgJ010IEh5ZHJhIC0gQ2F2ZSA5J10sXG4gIG10SHlkcmFDYXZlMTA6IFsweDg3LCAnTXQgSHlkcmEgLSBDYXZlIDEwJ10sXG4gIHN0eXgxOiBbMHg4OCwgJ1N0eXggMSddLFxuICBzdHl4MjogWzB4ODksICdTdHl4IDInXSxcbiAgc3R5eDM6IFsweDhhLCAnU3R5eCAzJ10sXG4gIC8vIElOVkFMSUQ6IDB4OGJcbiAgc2h5cm9uOiBbMHg4YywgJ1NoeXJvbiddLFxuICAvLyBJTlZBTElEOiAweDhkXG4gIGdvYTogWzB4OGUsICdHb2EnXSxcbiAgZ29hRm9ydHJlc3NPYXNpc0VudHJhbmNlOiBbMHg4ZiwgJ0dvYSBGb3J0cmVzcyAtIE9hc2lzIEVudHJhbmNlJ10sXG4gIGRlc2VydDE6IFsweDkwLCAnRGVzZXJ0IDEnXSxcbiAgb2FzaXNDYXZlTWFpbjogWzB4OTEsICdPYXNpcyBDYXZlIC0gTWFpbiddLFxuICBkZXNlcnRDYXZlMTogWzB4OTIsICdEZXNlcnQgQ2F2ZSAxJ10sXG4gIHNhaGFyYTogWzB4OTMsICdTYWhhcmEnXSxcbiAgc2FoYXJhT3V0c2lkZUNhdmU6IFsweDk0LCAnU2FoYXJhIC0gT3V0c2lkZSBDYXZlJ10sXG4gIGRlc2VydENhdmUyOiBbMHg5NSwgJ0Rlc2VydCBDYXZlIDInXSxcbiAgc2FoYXJhTWVhZG93OiBbMHg5NiwgJ1NhaGFyYSBNZWFkb3cnXSxcbiAgLy8gSU5WQUxJRDogMHg5N1xuICBkZXNlcnQyOiBbMHg5OCwgJ0Rlc2VydCAyJ10sXG4gIC8vIElOVkFMSUQ6IDB4OTlcbiAgLy8gSU5WQUxJRDogMHg5YVxuICAvLyBJTlZBTElEOiAweDliXG4gIHB5cmFtaWRFbnRyYW5jZTogWzB4OWMsICdQeXJhbWlkIC0gRW50cmFuY2UnXSxcbiAgcHlyYW1pZEJyYW5jaDogWzB4OWQsICdQeXJhbWlkIC0gQnJhbmNoJ10sXG4gIHB5cmFtaWRNYWluOiBbMHg5ZSwgJ1B5cmFtaWQgLSBNYWluJ10sXG4gIHB5cmFtaWREcmF5Z29uOiBbMHg5ZiwgJ1B5cmFtaWQgLSBEcmF5Z29uJ10sXG4gIGNyeXB0RW50cmFuY2U6IFsweGEwLCAnQ3J5cHQgLSBFbnRyYW5jZSddLFxuICBjcnlwdEhhbGwxOiBbMHhhMSwgJ0NyeXB0IC0gSGFsbCAxJ10sXG4gIGNyeXB0QnJhbmNoOiBbMHhhMiwgJ0NyeXB0IC0gQnJhbmNoJ10sXG4gIGNyeXB0RGVhZEVuZExlZnQ6IFsweGEzLCAnQ3J5cHQgLSBEZWFkIEVuZCBMZWZ0J10sXG4gIGNyeXB0RGVhZEVuZFJpZ2h0OiBbMHhhNCwgJ0NyeXB0IC0gRGVhZCBFbmQgUmlnaHQnXSxcbiAgY3J5cHRIYWxsMjogWzB4YTUsICdDcnlwdCAtIEhhbGwgMiddLFxuICBjcnlwdERyYXlnb24yOiBbMHhhNiwgJ0NyeXB0IC0gRHJheWdvbiAyJ10sXG4gIGNyeXB0VGVsZXBvcnRlcjogWzB4YTcsICdDcnlwdCAtIFRlbGVwb3J0ZXInXSxcbiAgZ29hRm9ydHJlc3NFbnRyYW5jZTogWzB4YTgsICdHb2EgRm9ydHJlc3MgLSBFbnRyYW5jZSddLFxuICBnb2FGb3J0cmVzc0tlbGJlc3F1ZTogWzB4YTksICdHb2EgRm9ydHJlc3MgLSBLZWxiZXNxdWUnXSxcbiAgZ29hRm9ydHJlc3NaZWJ1OiBbMHhhYSwgJ0dvYSBGb3J0cmVzcyAtIFplYnUnXSxcbiAgZ29hRm9ydHJlc3NTYWJlcmE6IFsweGFiLCAnR29hIEZvcnRyZXNzIC0gU2FiZXJhJ10sXG4gIGdvYUZvcnRyZXNzVG9ybmVsOiBbMHhhYywgJ0dvYSBGb3J0cmVzcyAtIFRvcm5lbCddLFxuICBnb2FGb3J0cmVzc01hZG8xOiBbMHhhZCwgJ0dvYSBGb3J0cmVzcyAtIE1hZG8gMSddLFxuICBnb2FGb3J0cmVzc01hZG8yOiBbMHhhZSwgJ0dvYSBGb3J0cmVzcyAtIE1hZG8gMiddLFxuICBnb2FGb3J0cmVzc01hZG8zOiBbMHhhZiwgJ0dvYSBGb3J0cmVzcyAtIE1hZG8gMyddLFxuICBnb2FGb3J0cmVzc0thcm1pbmUxOiBbMHhiMCwgJ0dvYSBGb3J0cmVzcyAtIEthcm1pbmUgMSddLFxuICBnb2FGb3J0cmVzc0thcm1pbmUyOiBbMHhiMSwgJ0dvYSBGb3J0cmVzcyAtIEthcm1pbmUgMiddLFxuICBnb2FGb3J0cmVzc0thcm1pbmUzOiBbMHhiMiwgJ0dvYSBGb3J0cmVzcyAtIEthcm1pbmUgMyddLFxuICBnb2FGb3J0cmVzc0thcm1pbmU0OiBbMHhiMywgJ0dvYSBGb3J0cmVzcyAtIEthcm1pbmUgNCddLFxuICBnb2FGb3J0cmVzc0thcm1pbmU1OiBbMHhiNCwgJ0dvYSBGb3J0cmVzcyAtIEthcm1pbmUgNSddLFxuICBnb2FGb3J0cmVzc0thcm1pbmU2OiBbMHhiNSwgJ0dvYSBGb3J0cmVzcyAtIEthcm1pbmUgNiddLFxuICBnb2FGb3J0cmVzc0thcm1pbmU3OiBbMHhiNiwgJ0dvYSBGb3J0cmVzcyAtIEthcm1pbmUgNyddLFxuICBnb2FGb3J0cmVzc0V4aXQ6IFsweGI3LCAnR29hIEZvcnRyZXNzIC0gRXhpdCddLFxuICBvYXNpc0NhdmVFbnRyYW5jZTogWzB4YjgsICdPYXNpcyBDYXZlIC0gRW50cmFuY2UnXSxcbiAgZ29hRm9ydHJlc3NBc2luYTogWzB4YjksICdHb2EgRm9ydHJlc3MgLSBBc2luYSddLFxuICBnb2FGb3J0cmVzc0tlbnN1OiBbMHhiYSwgJ0dvYSBGb3J0cmVzcyAtIEtlbnN1J10sXG4gIGdvYUhvdXNlOiBbMHhiYiwgJ0dvYSAtIEhvdXNlJ10sXG4gIGdvYUlubjogWzB4YmMsICdHb2EgLSBJbm4nXSxcbiAgLy8gSU5WQUxJRDogMHhiZFxuICBnb2FUb29sU2hvcDogWzB4YmUsICdHb2EgLSBUb29sIFNob3AnXSxcbiAgZ29hVGF2ZXJuOiBbMHhiZiwgJ0dvYSAtIFRhdmVybiddLFxuICBsZWFmRWxkZXJIb3VzZTogWzB4YzAsICdMZWFmIC0gRWxkZXIgSG91c2UnXSxcbiAgbGVhZlJhYmJpdEh1dDogWzB4YzEsICdMZWFmIC0gUmFiYml0IEh1dCddLFxuICBsZWFmSW5uOiBbMHhjMiwgJ0xlYWYgLSBJbm4nXSxcbiAgbGVhZlRvb2xTaG9wOiBbMHhjMywgJ0xlYWYgLSBUb29sIFNob3AnXSxcbiAgbGVhZkFybW9yU2hvcDogWzB4YzQsICdMZWFmIC0gQXJtb3IgU2hvcCddLFxuICBsZWFmU3R1ZGVudEhvdXNlOiBbMHhjNSwgJ0xlYWYgLSBTdHVkZW50IEhvdXNlJ10sXG4gIGJyeW5tYWVyVGF2ZXJuOiBbMHhjNiwgJ0JyeW5tYWVyIC0gVGF2ZXJuJ10sXG4gIGJyeW5tYWVyUGF3blNob3A6IFsweGM3LCAnQnJ5bm1hZXIgLSBQYXduIFNob3AnXSxcbiAgYnJ5bm1hZXJJbm46IFsweGM4LCAnQnJ5bm1hZXIgLSBJbm4nXSxcbiAgYnJ5bm1hZXJBcm1vclNob3A6IFsweGM5LCAnQnJ5bm1hZXIgLSBBcm1vciBTaG9wJ10sXG4gIC8vIElOVkFMSUQ6IDB4Y2FcbiAgYnJ5bm1hZXJJdGVtU2hvcDogWzB4Y2IsICdCcnlubWFlciAtIEl0ZW0gU2hvcCddLFxuICAvLyBJTlZBTElEOiAweGNjXG4gIG9ha0VsZGVySG91c2U6IFsweGNkLCAnT2FrIC0gRWxkZXIgSG91c2UnXSxcbiAgb2FrTW90aGVySG91c2U6IFsweGNlLCAnT2FrIC0gTW90aGVyIEhvdXNlJ10sXG4gIG9ha1Rvb2xTaG9wOiBbMHhjZiwgJ09hayAtIFRvb2wgU2hvcCddLFxuICBvYWtJbm46IFsweGQwLCAnT2FrIC0gSW5uJ10sXG4gIGFtYXpvbmVzSW5uOiBbMHhkMSwgJ0FtYXpvbmVzIC0gSW5uJ10sXG4gIGFtYXpvbmVzSXRlbVNob3A6IFsweGQyLCAnQW1hem9uZXMgLSBJdGVtIFNob3AnXSxcbiAgYW1hem9uZXNBcm1vclNob3A6IFsweGQzLCAnQW1hem9uZXMgLSBBcm1vciBTaG9wJ10sXG4gIGFtYXpvbmVzRWxkZXI6IFsweGQ0LCAnQW1hem9uZXMgLSBFbGRlciddLFxuICBuYWRhcmU6IFsweGQ1LCAnTmFkYXJlJ10sXG4gIHBvcnRvYUZpc2hlcm1hbkhvdXNlOiBbMHhkNiwgJ1BvcnRvYSAtIEZpc2hlcm1hbiBIb3VzZSddLFxuICBwb3J0b2FQYWxhY2VFbnRyYW5jZTogWzB4ZDcsICdQb3J0b2EgLSBQYWxhY2UgRW50cmFuY2UnXSxcbiAgcG9ydG9hRm9ydHVuZVRlbGxlcjogWzB4ZDgsICdQb3J0b2EgLSBGb3J0dW5lIFRlbGxlciddLFxuICBwb3J0b2FQYXduU2hvcDogWzB4ZDksICdQb3J0b2EgLSBQYXduIFNob3AnXSxcbiAgcG9ydG9hQXJtb3JTaG9wOiBbMHhkYSwgJ1BvcnRvYSAtIEFybW9yIFNob3AnXSxcbiAgLy8gSU5WQUxJRDogMHhkYlxuICBwb3J0b2FJbm46IFsweGRjLCAnUG9ydG9hIC0gSW5uJ10sXG4gIHBvcnRvYVRvb2xTaG9wOiBbMHhkZCwgJ1BvcnRvYSAtIFRvb2wgU2hvcCddLFxuICBwb3J0b2FQYWxhY2VMZWZ0OiBbMHhkZSwgJ1BvcnRvYSAtIFBhbGFjZSBMZWZ0J10sXG4gIHBvcnRvYVBhbGFjZVRocm9uZVJvb206IFsweGRmLCAnUG9ydG9hIC0gUGFsYWNlIFRocm9uZSBSb29tJ10sXG4gIHBvcnRvYVBhbGFjZVJpZ2h0OiBbMHhlMCwgJ1BvcnRvYSAtIFBhbGFjZSBSaWdodCddLFxuICBwb3J0b2FBc2luYVJvb206IFsweGUxLCAnUG9ydG9hIC0gQXNpbmEgUm9vbSddLFxuICBhbWF6b25lc0VsZGVyRG93bnN0YWlyczogWzB4ZTIsICdBbWF6b25lcyAtIEVsZGVyIERvd25zdGFpcnMnXSxcbiAgam9lbEVsZGVySG91c2U6IFsweGUzLCAnSm9lbCAtIEVsZGVyIEhvdXNlJ10sXG4gIGpvZWxTaGVkOiBbMHhlNCwgJ0pvZWwgLSBTaGVkJ10sXG4gIGpvZWxUb29sU2hvcDogWzB4ZTUsICdKb2VsIC0gVG9vbCBTaG9wJ10sXG4gIC8vIElOVkFMSUQ6IDB4ZTZcbiAgam9lbElubjogWzB4ZTcsICdKb2VsIC0gSW5uJ10sXG4gIHpvbWJpZVRvd25Ib3VzZTogWzB4ZTgsICdab21iaWUgVG93biAtIEhvdXNlJ10sXG4gIHpvbWJpZVRvd25Ib3VzZUJhc2VtZW50OiBbMHhlOSwgJ1pvbWJpZSBUb3duIC0gSG91c2UgQmFzZW1lbnQnXSxcbiAgLy8gSU5WQUxJRDogMHhlYVxuICBzd2FuVG9vbFNob3A6IFsweGViLCAnU3dhbiAtIFRvb2wgU2hvcCddLFxuICBzd2FuU3RvbUh1dDogWzB4ZWMsICdTd2FuIC0gU3RvbSBIdXQnXSxcbiAgc3dhbklubjogWzB4ZWQsICdTd2FuIC0gSW5uJ10sXG4gIHN3YW5Bcm1vclNob3A6IFsweGVlLCAnU3dhbiAtIEFybW9yIFNob3AnXSxcbiAgc3dhblRhdmVybjogWzB4ZWYsICdTd2FuIC0gVGF2ZXJuJ10sXG4gIHN3YW5QYXduU2hvcDogWzB4ZjAsICdTd2FuIC0gUGF3biBTaG9wJ10sXG4gIHN3YW5EYW5jZUhhbGw6IFsweGYxLCAnU3dhbiAtIERhbmNlIEhhbGwnXSxcbiAgc2h5cm9uRm9ydHJlc3M6IFsweGYyLCAnU2h5cm9uIC0gRm9ydHJlc3MnXSxcbiAgc2h5cm9uVHJhaW5pbmdIYWxsOiBbMHhmMywgJ1NoeXJvbiAtIFRyYWluaW5nIEhhbGwnXSxcbiAgc2h5cm9uSG9zcGl0YWw6IFsweGY0LCAnU2h5cm9uIC0gSG9zcGl0YWwnXSxcbiAgc2h5cm9uQXJtb3JTaG9wOiBbMHhmNSwgJ1NoeXJvbiAtIEFybW9yIFNob3AnXSxcbiAgc2h5cm9uVG9vbFNob3A6IFsweGY2LCAnU2h5cm9uIC0gVG9vbCBTaG9wJ10sXG4gIHNoeXJvbklubjogWzB4ZjcsICdTaHlyb24gLSBJbm4nXSxcbiAgc2FoYXJhSW5uOiBbMHhmOCwgJ1NhaGFyYSAtIElubiddLFxuICBzYWhhcmFUb29sU2hvcDogWzB4ZjksICdTYWhhcmEgLSBUb29sIFNob3AnXSxcbiAgc2FoYXJhRWxkZXJIb3VzZTogWzB4ZmEsICdTYWhhcmEgLSBFbGRlciBIb3VzZSddLFxuICBzYWhhcmFQYXduU2hvcDogWzB4ZmIsICdTYWhhcmEgLSBQYXduIFNob3AnXSxcbn0gYXMgY29uc3Q7XG4vLyB0eXBlIExvY2F0aW9ucyA9IHR5cGVvZiBMT0NBVElPTlM7XG5cbi8vIE5PVEU6IHRoaXMgd29ya3MgdG8gY29uc3RyYWluIHRoZSBrZXlzIHRvIGV4YWN0bHkgdGhlIHNhbWUuXG4vLyBjb25zdCB4OiB7cmVhZG9ubHkgW1QgaW4ga2V5b2YgdHlwZW9mIExPQ0FUSU9OU10/OiBzdHJpbmd9ID0ge307XG5cbi8vIE5PVEU6IHRoZSBmb2xsb3dpbmcgYWxsb3dzIHByZXR0eSByb2J1c3QgY2hlY2tzIVxuLy8gY29uc3QgeCA9IGNoZWNrPEtleXNPZjxMb2NhdGlvbnMsIHN0cmluZyB8IGJvb2xlYW4+PigpKHtcbi8vICAgbGVhZjogJ3gnLFxuLy8gICBzd2FuOiB0cnVlLFxuLy8gfSk7XG4vLyBjb25zdCB5ID0gY2hlY2s8S2V5c09mPHR5cGVvZiB4LCBudW1iZXIsIHN0cmluZz4+KCkoe1xuLy8gICBzd2FuOiAxLFxuLy8gfSk7XG5cbi8vIHR5cGUgS2V5c09mPFQsIFYgPSB1bmtub3duLCBSID0gdW5rbm93bj4gPSB7W0sgaW4ga2V5b2YgVF0/OiBUW0tdIGV4dGVuZHMgUiA/IFYgOiBuZXZlcn07XG5cbi8vIGZ1bmN0aW9uIGNoZWNrPFQ+KCk6IDxVIGV4dGVuZHMgVD4oYXJnOiBVKSA9PiBVIHtcbi8vICAgcmV0dXJuIGFyZyA9PiBhcmc7XG4vLyB9XG5cbi8vIGNvbnN0IGxvY2F0aW9uTmFtZXM6IChzdHJpbmcgfCB1bmRlZmluZWQpW10gPSAoKCkgPT4ge1xuLy8gICBjb25zdCBuYW1lcyA9IFtdO1xuLy8gICBmb3IgKGNvbnN0IGtleSBvZiBPYmplY3Qua2V5cyhMT0NBVElPTlMpKSB7XG4vLyAgICAgY29uc3QgW2lkLCBuYW1lXSA9IChMT0NBVElPTlMgYXMgYW55KVtrZXldO1xuLy8gICAgIG5hbWVzW2lkXSA9IG5hbWU7XG4vLyAgIH1cbi8vICAgcmV0dXJuIG5hbWVzO1xuLy8gfSkoKTtcblxuLy8gY29uc3QgbG9jYXRpb25LZXlzOiAobG9jYXRpb25LZXkgfCB1bmRlZmluZWQpW10gPSAoKCkgPT4ge1xuLy8gICBjb25zdCBrZXlzID0gW107XG4vLyAgIGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKExPQ0FUSU9OUykpIHtcbi8vICAgICBjb25zdCBbaWRdID0gKExPQ0FUSU9OUyBhcyBhbnkpW2tleV07XG4vLyAgICAga2V5c1tpZF0gPSBrZXk7XG4vLyAgIH1cbi8vICAgcmV0dXJuIGtleXMgYXMgYW55O1xuLy8gfSkoKTtcblxuXG4vLyB2ZXJ5IHNpbXBsZSB2ZXJzaW9uIG9mIHdoYXQgd2UncmUgZG9pbmcgd2l0aCBtZXRhc2NyZWVuc1xuY29uc3Qgc2NyZWVuRXhpdHM6IHtbaWQ6IG51bWJlcl06IHJlYWRvbmx5IFtudW1iZXIsIHJlYWRvbmx5IFtudW1iZXIsIG51bWJlcl1dfSA9IHtcbiAgMHgxNTogWzB4OTBfYTAsIFsweDg5LCAweDhhXV0sIC8vIGNhdmUgb24gbGVmdCBib3VuZGFyeVxuICAweDE5OiBbMHg2MF85MCwgWzB4NTgsIDB4NTldXSwgLy8gY2F2ZSBvbiByaWdodCBib3VuZGFyeSAobm90IG9uIGdyYXNzKVxuICAweDk2OiBbMHg0MF8zMCwgWzB4MzIsIDB4MzNdXSwgLy8gdXAgc3RhaXIgZnJvbSBsZWZ0XG4gIDB4OTc6IFsweGFmXzMwLCBbMHhiMiwgMHhiM11dLCAvLyBkb3duIHN0YWlyIGZyb20gbGVmdFxuICAweDk4OiBbMHg0MF9kMCwgWzB4M2MsIDB4M2RdXSwgLy8gdXAgc3RhaXIgZnJvbSByaWdodFxuICAweDk5OiBbMHhhZl9kMCwgWzB4YmMsIDB4YmRdXSwgLy8gZG93biBzdGFpciBmcm9tIHJpZ2h0XG4gIDB4OWE6IFsweDFmXzgwLCBbMHgyNywgMHgyOF1dLCAvLyBkb3duIHN0YWlyIChkb3VibGUgLSBqdXN0IHVzZSBkb3duISlcbiAgMHg5ZTogWzB4ZGZfODAsIFsweGU3LCAweGU4XV0sIC8vIGJvdHRvbSBlZGdlXG4gIDB4YzI6IFsweDYwX2IwLCBbMHg1YSwgMHg1Yl1dLCAvLyBjYXZlIG9uIGJvdHRvbS1yaWdodCBib3VuZGFyeVxufTtcblxuLy8gYnVpbGRpbmcgdGhlIENTViBmb3IgdGhlIGxvY2F0aW9uIHRhYmxlLlxuLy9jb25zdCBoPSh4KT0+eD09bnVsbD8nbnVsbCc6JyQnK3gudG9TdHJpbmcoMTYpLnBhZFN0YXJ0KDIsMCk7XG4vLydpZCxuYW1lLGJnbSx3aWR0aCxoZWlnaHQsYW5pbWF0aW9uLGV4dGVuZGVkLHRpbGVwYXQwLHRpbGVwYXQxLHRpbGVwYWwwLHRpbGVwYWwxLHRpbGVzZXQsdGlsZSBlZmZlY3RzLGV4aXRzLHNwcnBhdDAsc3BycGF0MSxzcHJwYWwwLHNwcnBhbDEsb2JqMGQsb2JqMGUsb2JqMGYsb2JqMTAsb2JqMTEsb2JqMTIsb2JqMTMsb2JqMTQsb2JqMTUsb2JqMTYsb2JqMTcsb2JqMTgsb2JqMTksb2JqMWEsb2JqMWIsb2JqMWMsb2JqMWQsb2JqMWUsb2JqMWZcXG4nK3JvbS5sb2NhdGlvbnMubWFwKGw9PiFsfHwhbC51c2VkPycnOltoKGwuaWQpLGwubmFtZSxoKGwuYmdtKSxsLmxheW91dFdpZHRoLGwubGF5b3V0SGVpZ2h0LGwuYW5pbWF0aW9uLGwuZXh0ZW5kZWQsaCgobC50aWxlUGF0dGVybnN8fFtdKVswXSksaCgobC50aWxlUGF0dGVybnN8fFtdKVsxXSksaCgobC50aWxlUGFsZXR0ZXN8fFtdKVswXSksaCgobC50aWxlUGFsZXR0ZXN8fFtdKVsxXSksaChsLnRpbGVzZXQpLGgobC50aWxlRWZmZWN0cyksWy4uLm5ldyBTZXQobC5leGl0cy5tYXAoeD0+aCh4WzJdKSkpXS5qb2luKCc6JyksaCgobC5zcHJpdGVQYXR0ZXJuc3x8W10pWzBdKSxoKChsLnNwcml0ZVBhdHRlcm5zfHxbXSlbMV0pLGgoKGwuc3ByaXRlUGFsZXR0ZXN8fFtdKVswXSksaCgobC5zcHJpdGVQYWxldHRlc3x8W10pWzFdKSwuLi5uZXcgQXJyYXkoMTkpLmZpbGwoMCkubWFwKCh2LGkpPT4oKGwub2JqZWN0c3x8W10pW2ldfHxbXSkuc2xpY2UoMikubWFwKHg9PngudG9TdHJpbmcoMTYpKS5qb2luKCc6JykpXSkuZmlsdGVyKHg9PngpLmpvaW4oJ1xcbicpXG5cbi8vIGJ1aWxkaW5nIGNzdiBmb3IgbG9jLW9iaiBjcm9zcy1yZWZlcmVuY2UgdGFibGVcbi8vIHNlcT0ocyxlLGYpPT5uZXcgQXJyYXkoZS1zKS5maWxsKDApLm1hcCgoeCxpKT0+ZihpK3MpKTtcbi8vIHVuaXE9KGFycik9Pntcbi8vICAgY29uc3QgbT17fTtcbi8vICAgZm9yIChsZXQgbyBvZiBhcnIpIHtcbi8vICAgICBvWzZdPW9bNV0/MTowO1xuLy8gICAgIGlmKCFvWzVdKW1bb1syXV09KG1bb1syXV18fDApKzE7XG4vLyAgIH1cbi8vICAgZm9yIChsZXQgbyBvZiBhcnIpIHtcbi8vICAgICBpZihvWzJdIGluIG0pb1s2XT1tW29bMl1dO1xuLy8gICAgIGRlbGV0ZSBtW29bMl1dO1xuLy8gICB9XG4vLyAgIHJldHVybiBhcnI7XG4vLyB9XG4vLyAnbG9jLGxvY25hbWUsbW9uLG1vbm5hbWUsc3Bhd24sdHlwZSx1bmlxLHBhdHNsb3QscGF0LHBhbHNsb3QscGFsMixwYWwzXFxuJytcbi8vIHJvbS5sb2NhdGlvbnMuZmxhdE1hcChsPT4hbHx8IWwudXNlZD9bXTp1bmlxKHNlcSgweGQsMHgyMCxzPT57XG4vLyAgIGNvbnN0IG89KGwub2JqZWN0c3x8W10pW3MtMHhkXXx8bnVsbDtcbi8vICAgaWYgKCFvKSByZXR1cm4gbnVsbDtcbi8vICAgY29uc3QgdHlwZT1vWzJdJjc7XG4vLyAgIGNvbnN0IG09dHlwZT9udWxsOjB4NTArb1szXTtcbi8vICAgY29uc3QgcGF0U2xvdD1vWzJdJjB4ODA/MTowO1xuLy8gICBjb25zdCBtb249bT9yb20ub2JqZWN0c1ttXTpudWxsO1xuLy8gICBjb25zdCBwYWxTbG90PShtb24/bW9uLnBhbGV0dGVzKGZhbHNlKTpbXSlbMF07XG4vLyAgIGNvbnN0IGFsbFBhbD1uZXcgU2V0KG1vbj9tb24ucGFsZXR0ZXModHJ1ZSk6W10pO1xuLy8gICByZXR1cm4gW2gobC5pZCksbC5uYW1lLGgobSksJycsaChzKSx0eXBlLDAscGF0U2xvdCxtP2goKGwuc3ByaXRlUGF0dGVybnN8fFtdKVtwYXRTbG90XSk6JycscGFsU2xvdCxhbGxQYWwuaGFzKDIpP2goKGwuc3ByaXRlUGFsZXR0ZXN8fFtdKVswXSk6JycsYWxsUGFsLmhhcygzKT9oKChsLnNwcml0ZVBhbGV0dGVzfHxbXSlbMV0pOicnXTtcbi8vIH0pLmZpbHRlcih4PT54KSkpLm1hcChhPT5hLmpvaW4oJywnKSkuZmlsdGVyKHg9PngpLmpvaW4oJ1xcbicpO1xuIl19