import { CaveShuffle, CryptEntranceShuffle, WideCaveShuffle } from '../maze/cave.js';
import { Random } from '../random.js';
import { BridgeCaveShuffle } from '../maze/doublecave.js';
import { CycleCaveShuffle, TightCycleCaveShuffle } from '../maze/cyclecave.js';
import { RiverCaveShuffle, StyxRiverCaveShuffle, WaterfallRiverCaveShuffle, OasisCaveShuffle, OasisEntranceCaveShuffle } from '../maze/rivercave.js';
import { SwampShuffle, addSwampDoors } from '../maze/swamp.js';
import { SaberaPalaceShuffle } from '../maze/twostage.js';
import { LabyrinthShuffle, fixLabyrinthScreens } from '../maze/goa.js';
import { PyramidShuffle } from '../maze/pyramid.js';
import { wideArenaExits } from '../rom/screenfix.js';
import { KarmineBasementShuffle, KarmineKensuShuffle, KarmineMainShuffle, KarmineUpstairsShuffle } from '../maze/karmine.js';
export function shuffleMazes(rom, flags, random) {
    const $ = rom.locations;
    prepareScreens(rom, random);
    const shuffles = [
        new CaveShuffle($.EastCave1),
        new CaveShuffle($.EastCave2),
        new CaveShuffle($.EastCave3),
        new BridgeCaveShuffle($.SealedCave2, $.SealedCave1),
        new CaveShuffle($.SealedCave3),
        new CaveShuffle($.SealedCave4),
        new CaveShuffle($.SealedCave5),
        new CaveShuffle($.SealedCave6),
        new CaveShuffle($.SealedCave7),
        new CaveShuffle($.SealedCave8),
        new CaveShuffle($.WindmillCave),
        new CaveShuffle($.ZebuCave),
        new SwampShuffle($.Swamp),
        new CaveShuffle($.MtSabreWest_Cave1),
        new CaveShuffle($.MtSabreWest_Cave2),
        new CaveShuffle($.MtSabreWest_Cave3),
        new CaveShuffle($.MtSabreWest_Cave4),
        new CaveShuffle($.MtSabreWest_Cave5),
        new CaveShuffle($.MtSabreWest_Cave6),
        new CycleCaveShuffle($.MtSabreWest_Cave7),
        new CaveShuffle($.MtSabreNorth_Cave1),
        new CaveShuffle($.MtSabreNorth_Cave2),
        new CaveShuffle($.MtSabreNorth_Cave3),
        new CaveShuffle($.MtSabreNorth_Cave4),
        new CaveShuffle($.MtSabreNorth_Cave5),
        new CaveShuffle($.MtSabreNorth_Cave6),
        new CaveShuffle($.MtSabreNorth_Cave7),
        new CaveShuffle($.MtSabreNorth_Cave8),
        new CaveShuffle($.MtSabreNorth_Cave9),
        new CaveShuffle($.MtSabreNorth_LeftCell2),
        new CaveShuffle($.MtSabreNorth_SummitCave),
        new CaveShuffle($.KirisaPlantCave1),
        new CaveShuffle($.KirisaPlantCave2),
        new CaveShuffle($.KirisaPlantCave3),
        new CaveShuffle($.FogLampCave1),
        new CaveShuffle($.FogLampCave2),
        new CaveShuffle($.FogLampCave3),
        new TightCycleCaveShuffle($.FogLampCaveDeadEnd),
        new BridgeCaveShuffle($.FogLampCave4, $.FogLampCave5, true),
        new BridgeCaveShuffle($.FogLampCave6, $.FogLampCave7),
        new CycleCaveShuffle($.WaterfallCave1),
        new CaveShuffle($.WaterfallCave2),
        new WideCaveShuffle($.WaterfallCave3),
        new WaterfallRiverCaveShuffle($.WaterfallCave4),
        new RiverCaveShuffle($.EvilSpiritIsland2).requirePitDestination(),
        new CycleCaveShuffle($.EvilSpiritIsland3),
        new RiverCaveShuffle($.EvilSpiritIsland4),
        new SaberaPalaceShuffle($.SaberaPalace1).requirePitDestination(),
        new CaveShuffle($.SaberaPalace2),
        new CaveShuffle($.SaberaPalace2_West),
        new CaveShuffle($.JoelSecretPassage),
        new CaveShuffle($.MtHydra_Cave1),
        new CaveShuffle($.MtHydra_Cave2),
        new CaveShuffle($.MtHydra_Cave3),
        new CaveShuffle($.MtHydra_Cave4),
        new CaveShuffle($.MtHydra_Cave5),
        new CaveShuffle($.MtHydra_Cave6),
        new WideCaveShuffle($.MtHydra_Cave7),
        new CaveShuffle($.MtHydra_Cave8),
        new CaveShuffle($.MtHydra_Cave9),
        new CaveShuffle($.MtHydra_Cave10),
        new WideCaveShuffle($.Styx1),
        new StyxRiverCaveShuffle($.Styx2).requirePitDestination(),
        new CaveShuffle($.Styx3),
        new OasisCaveShuffle($.OasisCaveMain),
        new CaveShuffle($.DesertCave1),
        new CaveShuffle($.DesertCave2),
        new CaveShuffle($.Pyramid_Branch),
        new PyramidShuffle($.Pyramid_Main),
        new CryptEntranceShuffle($.Crypt_Entrance),
        new WideCaveShuffle($.Crypt_Hall1),
        new CaveShuffle($.Crypt_DeadEndLeft),
        new CaveShuffle($.Crypt_DeadEndRight),
        new CaveShuffle($.Crypt_Branch),
        new CaveShuffle($.Crypt_Hall2),
        new LabyrinthShuffle($.GoaFortress_Kelbesque),
        new RiverCaveShuffle($.GoaFortress_Sabera),
        new CaveShuffle($.GoaFortress_Mado1).requirePitDestination(),
        new CaveShuffle($.GoaFortress_Mado2),
        new CaveShuffle($.GoaFortress_Mado3),
        new CaveShuffle($.GoaFortress_Karmine1),
        new CaveShuffle($.GoaFortress_Karmine2),
        new CaveShuffle($.GoaFortress_Karmine4),
        new KarmineBasementShuffle($.GoaFortress_Karmine6),
        new KarmineUpstairsShuffle($.GoaFortress_Karmine3),
        new KarmineMainShuffle($.GoaFortress_Karmine5),
        new KarmineKensuShuffle($.GoaFortress_Kensu),
        new OasisEntranceCaveShuffle($.OasisCave_Entrance),
    ];
    for (const shuffle of shuffles) {
        shuffle.shuffle(random);
    }
    for (const loc of $) {
        loc.meta.shufflePits(random);
    }
}
export function prepareScreens(rom, random = new Random(1)) {
    wideArenaExits(rom);
    addSwampDoors(rom);
    fixLabyrinthScreens(rom, random);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2h1ZmZsZW1hemVzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2pzL3Bhc3Mvc2h1ZmZsZW1hemVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLE9BQU8sRUFBRSxXQUFXLEVBQUUsb0JBQW9CLEVBQ2pDLGVBQWUsRUFBRSxNQUFNLGlCQUFpQixDQUFDO0FBSWxELE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxjQUFjLENBQUM7QUFFdEMsT0FBTyxFQUFFLGlCQUFpQixFQUFFLE1BQU0sdUJBQXVCLENBQUM7QUFDMUQsT0FBTyxFQUFFLGdCQUFnQixFQUFFLHFCQUFxQixFQUFFLE1BQU0sc0JBQXNCLENBQUM7QUFDL0UsT0FBTyxFQUFFLGdCQUFnQixFQUFFLG9CQUFvQixFQUFFLHlCQUF5QixFQUNqRSxnQkFBZ0IsRUFBRSx3QkFBd0IsRUFBRSxNQUFNLHNCQUFzQixDQUFDO0FBQ2xGLE9BQU8sRUFBRSxZQUFZLEVBQUUsYUFBYSxFQUFFLE1BQU0sa0JBQWtCLENBQUM7QUFDL0QsT0FBTyxFQUFFLG1CQUFtQixFQUFFLE1BQU0scUJBQXFCLENBQUM7QUFDMUQsT0FBTyxFQUFFLGdCQUFnQixFQUFFLG1CQUFtQixFQUFFLE1BQU0sZ0JBQWdCLENBQUM7QUFDdkUsT0FBTyxFQUFFLGNBQWMsRUFBRSxNQUFNLG9CQUFvQixDQUFDO0FBQ3BELE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSxxQkFBcUIsQ0FBQztBQUNyRCxPQUFPLEVBQUUsc0JBQXNCLEVBQUUsbUJBQW1CLEVBQUUsa0JBQWtCLEVBQy9ELHNCQUFzQixFQUFFLE1BQU0sb0JBQW9CLENBQUM7QUFNNUQsTUFBTSxVQUFVLFlBQVksQ0FBQyxHQUFRLEVBQUUsS0FBYyxFQUFFLE1BQWM7SUFTbkUsTUFBTSxDQUFDLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQztJQUV4QixjQUFjLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBRTVCLE1BQU0sUUFB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QkFBb0IsQ0FBQztRQUN2QyxJQUFJLFdBQVcsQ0FBQyxDQUFDLENBQUMsb0JBQW9CLENBQUM7UUFDdkMsSUFBSSxzQkFBc0IsQ0FBQyxDQUFDLENBQUMsb0JBQW9CLENBQUM7UUFDbEQsSUFBSSxzQkFBc0IsQ0FBQyxDQUFDLENBQUMsb0JBQW9CLENBQUM7UUFDbEQsSUFBSSxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsb0JBQW9CLENBQUM7UUFDOUMsSUFBSSxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsaUJBQWlCLENBQUM7UUFDNUMsSUFBSSx3QkFBd0IsQ0FBQyxDQUFDLENBQUMsa0JBQWtCLENBQUM7S0FJbkQsQ0FBQztJQUNGLEtBQUssTUFBTSxPQUFPLElBQUksUUFBUSxFQUFFO1FBQzlCLE9BQU8sQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7S0FDekI7SUFFRCxLQUFLLE1BQU0sR0FBRyxJQUFJLENBQUMsRUFBRTtRQUNuQixHQUFHLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQztLQUM5QjtBQUNILENBQUM7QUFFRCxNQUFNLFVBQVUsY0FBYyxDQUFDLEdBQVEsRUFBRSxNQUFNLEdBQUcsSUFBSSxNQUFNLENBQUMsQ0FBQyxDQUFDO0lBQzdELGNBQWMsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNwQixhQUFhLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDbkIsbUJBQW1CLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQ25DLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBGbGFnU2V0IH0gZnJvbSAnLi4vZmxhZ3NldC5qcyc7XG5pbXBvcnQgeyBDYXZlU2h1ZmZsZSwgQ3J5cHRFbnRyYW5jZVNodWZmbGUsXG4gICAgICAgICBXaWRlQ2F2ZVNodWZmbGUgfSBmcm9tICcuLi9tYXplL2NhdmUuanMnO1xuLy8gaW1wb3J0IHtleHRlbmRHb2FTY3JlZW5zLyosIHNodWZmbGVHb2ExKi99IGZyb20gJy4uL21hemUvZ29hLmpzJztcbi8vaW1wb3J0IHtzaHVmZmxlU3dhbXB9IGZyb20gJy4uL21hemUvc3dhbXAuanMnO1xuLy9pbXBvcnQge3NodWZmbGVQeXJhbWlkfSBmcm9tICcuLi9tYXplL3B5cmFtaWQuanMnO1xuaW1wb3J0IHsgUmFuZG9tIH0gZnJvbSAnLi4vcmFuZG9tLmpzJztcbmltcG9ydCB7IFJvbSB9IGZyb20gJy4uL3JvbS5qcyc7XG5pbXBvcnQgeyBCcmlkZ2VDYXZlU2h1ZmZsZSB9IGZyb20gJy4uL21hemUvZG91YmxlY2F2ZS5qcyc7XG5pbXBvcnQgeyBDeWNsZUNhdmVTaHVmZmxlLCBUaWdodEN5Y2xlQ2F2ZVNodWZmbGUgfSBmcm9tICcuLi9tYXplL2N5Y2xlY2F2ZS5qcyc7XG5pbXBvcnQgeyBSaXZlckNhdmVTaHVmZmxlLCBTdHl4Uml2ZXJDYXZlU2h1ZmZsZSwgV2F0ZXJmYWxsUml2ZXJDYXZlU2h1ZmZsZSxcbiAgICAgICAgIE9hc2lzQ2F2ZVNodWZmbGUsIE9hc2lzRW50cmFuY2VDYXZlU2h1ZmZsZSB9IGZyb20gJy4uL21hemUvcml2ZXJjYXZlLmpzJztcbmltcG9ydCB7IFN3YW1wU2h1ZmZsZSwgYWRkU3dhbXBEb29ycyB9IGZyb20gJy4uL21hemUvc3dhbXAuanMnO1xuaW1wb3J0IHsgU2FiZXJhUGFsYWNlU2h1ZmZsZSB9IGZyb20gJy4uL21hemUvdHdvc3RhZ2UuanMnO1xuaW1wb3J0IHsgTGFieXJpbnRoU2h1ZmZsZSwgZml4TGFieXJpbnRoU2NyZWVucyB9IGZyb20gJy4uL21hemUvZ29hLmpzJztcbmltcG9ydCB7IFB5cmFtaWRTaHVmZmxlIH0gZnJvbSAnLi4vbWF6ZS9weXJhbWlkLmpzJztcbmltcG9ydCB7IHdpZGVBcmVuYUV4aXRzIH0gZnJvbSAnLi4vcm9tL3NjcmVlbmZpeC5qcyc7XG5pbXBvcnQgeyBLYXJtaW5lQmFzZW1lbnRTaHVmZmxlLCBLYXJtaW5lS2Vuc3VTaHVmZmxlLCBLYXJtaW5lTWFpblNodWZmbGUsXG4gICAgICAgICBLYXJtaW5lVXBzdGFpcnNTaHVmZmxlIH0gZnJvbSAnLi4vbWF6ZS9rYXJtaW5lLmpzJztcblxuaW50ZXJmYWNlIFNodWZmbGUge1xuICBzaHVmZmxlKHJhbmRvbTogUmFuZG9tKTogdm9pZDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNodWZmbGVNYXplcyhyb206IFJvbSwgZmxhZ3M6IEZsYWdTZXQsIHJhbmRvbTogUmFuZG9tKSB7XG4gIC8vIFRPRE8gLSBjb25zb2xpZGF0ZSBmcmVlIGZsYWdzPyAgRmluZCBhIGxpc3Qgb2Ygd2hhdCdzIHVzZWQuLi5cbiAgLy8gWy4uLm5ldyBTZXQocm9tLmxvY2F0aW9ucy5mbGF0TWFwKGwgPT4gbC5mbGFncy5tYXAoZiA9PiBmLmZsYWcpXG4gIC8vICAgICAgICAgICAuZmlsdGVyKGYgPT4gZiAhPSAweDIwMCkubWFwKHg9PngudG9TdHJpbmcoMTYpKSkpXS5zb3J0KClcbiAgLy8gQWxzbyBtYXAgb3ZlciB0cmlnZ2VycywgZGlhbG9ncyAtIGZpbmQgd2hhdCdzIHNldC9jbGVhcmVkXG4gIC8vIEFsc28gMmYwIGlzIGNvLW9wdGVkIGFzIGFuIFwiYWx3YXlzIHRydWVcIiB0cmlnZ2VyLlxuICAvLyBzaHVmZmxlUHlyYW1pZChyb20sIHJhbmRvbSk7XG4gIC8vIHNodWZmbGVTd2FtcChyb20sIHJhbmRvbSk7XG4gIC8vIHNodWZmbGVHb2ExKHJvbSwgcmFuZG9tKTtcbiAgY29uc3QgJCA9IHJvbS5sb2NhdGlvbnM7XG5cbiAgcHJlcGFyZVNjcmVlbnMocm9tLCByYW5kb20pO1xuXG4gIGNvbnN0IHNodWZmbGVzOiBTaHVmZmxlW10gPSBbXG4gICAgLy8gbmV3IFRvd25TaHVmZmxlKCQuTGVhZiksXG4gICAgLy8gbmV3IE92ZXJ3b3JsZFNodWZmbGUoJC5WYWxsZXlPZldpbmQpLFxuICAgIG5ldyBDYXZlU2h1ZmZsZSgkLkVhc3RDYXZlMSksXG4gICAgbmV3IENhdmVTaHVmZmxlKCQuRWFzdENhdmUyKSxcbiAgICBuZXcgQ2F2ZVNodWZmbGUoJC5FYXN0Q2F2ZTMpLFxuICAgIG5ldyBCcmlkZ2VDYXZlU2h1ZmZsZSgkLlNlYWxlZENhdmUyLCAkLlNlYWxlZENhdmUxKSxcbiAgICBuZXcgQ2F2ZVNodWZmbGUoJC5TZWFsZWRDYXZlMyksXG4gICAgbmV3IENhdmVTaHVmZmxlKCQuU2VhbGVkQ2F2ZTQpLFxuICAgIG5ldyBDYXZlU2h1ZmZsZSgkLlNlYWxlZENhdmU1KSxcbiAgICBuZXcgQ2F2ZVNodWZmbGUoJC5TZWFsZWRDYXZlNiksXG4gICAgbmV3IENhdmVTaHVmZmxlKCQuU2VhbGVkQ2F2ZTcpLFxuICAgIG5ldyBDYXZlU2h1ZmZsZSgkLlNlYWxlZENhdmU4KSxcbiAgICBuZXcgQ2F2ZVNodWZmbGUoJC5XaW5kbWlsbENhdmUpLFxuICAgIG5ldyBDYXZlU2h1ZmZsZSgkLlplYnVDYXZlKSxcbiAgICAvLyBuZXcgT3ZlcndvcmxkU2h1ZmZsZSgkLkNvcmRlbFBsYWluV2VzdCwgJC5Db3JkZWxQbGFpbkVhc3QpLFxuICAgIC8vIG5ldyBUb3duU2h1ZmZsZSgkLkJyeW5tYWVyKSxcbiAgICAvLyBuZXcgVG93blNodWZmbGUoJC5BbWF6b25lcyksXG4gICAgbmV3IFN3YW1wU2h1ZmZsZSgkLlN3YW1wKSxcbiAgICAvLyBuZXcgVG93blNodWZmbGUoJC5PYWspLFxuICAgIC8vIG5ldyBKb2luZWRNb3VudGFpblNodWZmbGUoJC5NdFNhYnJlV2VzdF9VcHBlciwgJC5NdFNhYnJlV2VzdF9Mb3dlciksXG4gICAgbmV3IENhdmVTaHVmZmxlKCQuTXRTYWJyZVdlc3RfQ2F2ZTEpLFxuICAgIG5ldyBDYXZlU2h1ZmZsZSgkLk10U2FicmVXZXN0X0NhdmUyKSxcbiAgICBuZXcgQ2F2ZVNodWZmbGUoJC5NdFNhYnJlV2VzdF9DYXZlMyksXG4gICAgbmV3IENhdmVTaHVmZmxlKCQuTXRTYWJyZVdlc3RfQ2F2ZTQpLFxuICAgIG5ldyBDYXZlU2h1ZmZsZSgkLk10U2FicmVXZXN0X0NhdmU1KSxcbiAgICBuZXcgQ2F2ZVNodWZmbGUoJC5NdFNhYnJlV2VzdF9DYXZlNiksXG4gICAgbmV3IEN5Y2xlQ2F2ZVNodWZmbGUoJC5NdFNhYnJlV2VzdF9DYXZlNyksXG4gICAgLy8gbmV3IFNwbGl0TW91bnRhaW5TaHVmZmxlKCQuTXRTYWJyZU5vcnRoX01haW4sICQuTXRTYWJyZU5vcnRoX01pZGRsZSksXG4gICAgbmV3IENhdmVTaHVmZmxlKCQuTXRTYWJyZU5vcnRoX0NhdmUxKSxcbiAgICBuZXcgQ2F2ZVNodWZmbGUoJC5NdFNhYnJlTm9ydGhfQ2F2ZTIpLFxuICAgIG5ldyBDYXZlU2h1ZmZsZSgkLk10U2FicmVOb3J0aF9DYXZlMyksXG4gICAgbmV3IENhdmVTaHVmZmxlKCQuTXRTYWJyZU5vcnRoX0NhdmU0KSxcbiAgICBuZXcgQ2F2ZVNodWZmbGUoJC5NdFNhYnJlTm9ydGhfQ2F2ZTUpLFxuICAgIG5ldyBDYXZlU2h1ZmZsZSgkLk10U2FicmVOb3J0aF9DYXZlNiksXG4gICAgbmV3IENhdmVTaHVmZmxlKCQuTXRTYWJyZU5vcnRoX0NhdmU3KSxcbiAgICBuZXcgQ2F2ZVNodWZmbGUoJC5NdFNhYnJlTm9ydGhfQ2F2ZTgpLFxuICAgIG5ldyBDYXZlU2h1ZmZsZSgkLk10U2FicmVOb3J0aF9DYXZlOSksXG4gICAgbmV3IENhdmVTaHVmZmxlKCQuTXRTYWJyZU5vcnRoX0xlZnRDZWxsMiksXG4gICAgbmV3IENhdmVTaHVmZmxlKCQuTXRTYWJyZU5vcnRoX1N1bW1pdENhdmUpLFxuICAgIC8vIG5ldyBPdmVyd29ybGRTaHVmZmxlKCQuV2F0ZXJmYWxsVmFsbGV5Tm9ydGgsICQuV2F0ZXJmYWxsVmFsbGV5U291dGgpLFxuICAgIC8vIG5ldyBPdmVyd29ybGRTaHVmZmxlKCQuTGltZVRyZWVWYWxsZXkpLFxuICAgIG5ldyBDYXZlU2h1ZmZsZSgkLktpcmlzYVBsYW50Q2F2ZTEpLFxuICAgIG5ldyBDYXZlU2h1ZmZsZSgkLktpcmlzYVBsYW50Q2F2ZTIpLFxuICAgIG5ldyBDYXZlU2h1ZmZsZSgkLktpcmlzYVBsYW50Q2F2ZTMpLFxuICAgIC8vIG5ldyBPdmVyd29ybGRTaHVmZmxlKCQuS2lyaXNhTWVhZG93KSxcbiAgICBuZXcgQ2F2ZVNodWZmbGUoJC5Gb2dMYW1wQ2F2ZTEpLFxuICAgIG5ldyBDYXZlU2h1ZmZsZSgkLkZvZ0xhbXBDYXZlMiksXG4gICAgbmV3IENhdmVTaHVmZmxlKCQuRm9nTGFtcENhdmUzKSxcbiAgICBuZXcgVGlnaHRDeWNsZUNhdmVTaHVmZmxlKCQuRm9nTGFtcENhdmVEZWFkRW5kKSxcbiAgICBuZXcgQnJpZGdlQ2F2ZVNodWZmbGUoJC5Gb2dMYW1wQ2F2ZTQsICQuRm9nTGFtcENhdmU1LCB0cnVlIC8qcmV2ZXJzZWQqLyksXG4gICAgbmV3IEJyaWRnZUNhdmVTaHVmZmxlKCQuRm9nTGFtcENhdmU2LCAkLkZvZ0xhbXBDYXZlNyksXG4gICAgLy8gbmV3IFRvd25TaHVmZmxlKCQuUG9ydG9hKSxcbiAgICBuZXcgQ3ljbGVDYXZlU2h1ZmZsZSgkLldhdGVyZmFsbENhdmUxKSxcbiAgICBuZXcgQ2F2ZVNodWZmbGUoJC5XYXRlcmZhbGxDYXZlMiksXG4gICAgbmV3IFdpZGVDYXZlU2h1ZmZsZSgkLldhdGVyZmFsbENhdmUzKSxcbiAgICBuZXcgV2F0ZXJmYWxsUml2ZXJDYXZlU2h1ZmZsZSgkLldhdGVyZmFsbENhdmU0KSxcbiAgICAvLyBuZXcgVG93ZXJTaHVmZmxlKCQuVG93ZXIxLCAkLlRvd2VyMiwgJC5Ub3dlcjMsICQuVG93ZXJPdXRzaWRlTWVzaWEpLFxuICAgIC8vIG5ldyBTZWFTaHVmZmxlKCQuQW5ncnlTZWEpLFxuICAgIC8vIG5ldyBDaGFubmVsU2h1ZmZsZSgkLlVuZGVyZ3JvdW5kQ2hhbm5lbCksXG4gICAgLy8gbmV3IFRvd25TaHVmZmxlKCQuWm9tYmllVG93biksXG4gICAgLy8gbmV3IENoYW5uZWxTaHVmZmxlKCQuRXZpbFNwaXJpdElzbGFuZDEpLFxuICAgIG5ldyBSaXZlckNhdmVTaHVmZmxlKCQuRXZpbFNwaXJpdElzbGFuZDIpLnJlcXVpcmVQaXREZXN0aW5hdGlvbigpLFxuICAgIG5ldyBDeWNsZUNhdmVTaHVmZmxlKCQuRXZpbFNwaXJpdElzbGFuZDMpLCAvLyBwaXQ6ICQuRXZpbFNwaXJpdElzbGFuZDJcbiAgICBuZXcgUml2ZXJDYXZlU2h1ZmZsZSgkLkV2aWxTcGlyaXRJc2xhbmQ0KSxcbiAgICBuZXcgU2FiZXJhUGFsYWNlU2h1ZmZsZSgkLlNhYmVyYVBhbGFjZTEpLnJlcXVpcmVQaXREZXN0aW5hdGlvbigpLFxuICAgIC8vIC8vIFRPRE8gLSBjb25zaWRlciBqdXN0IG1ha2luZyB0aGlzIGludG8gdHdvIHNlcGFyYXRlIG1hcHM/XG4gICAgbmV3IENhdmVTaHVmZmxlKCQuU2FiZXJhUGFsYWNlMiksXG4gICAgbmV3IENhdmVTaHVmZmxlKCQuU2FiZXJhUGFsYWNlMl9XZXN0KSxcbiAgICAvLyAvLyBuZXcgU3BsaXRQaXRTaHVmZmxlKCQuU2FiZXJhUGFsYWNlMiwgJC5TYWJlcmFQYWxhY2UxKSxcbiAgICBuZXcgQ2F2ZVNodWZmbGUoJC5Kb2VsU2VjcmV0UGFzc2FnZSksXG4gICAgLy8gbmV3IFRvd25TaHVmZmxlKCQuSm9lbCksXG4gICAgLy8gbmV3IFRvd25TaHVmZmxlKCQuU3dhbiksXG4gICAgLy8gbmV3IE92ZXJ3b3JsZFNodWZmbGUoJC5Hb2FWYWxsZXkpLFxuICAgIC8vIG5ldyBNb3VudGFpblNodWZmbGUoJC5NdEh5ZHJhKSxcbiAgICBuZXcgQ2F2ZVNodWZmbGUoJC5NdEh5ZHJhX0NhdmUxKSxcbiAgICBuZXcgQ2F2ZVNodWZmbGUoJC5NdEh5ZHJhX0NhdmUyKSxcbiAgICBuZXcgQ2F2ZVNodWZmbGUoJC5NdEh5ZHJhX0NhdmUzKSxcbiAgICBuZXcgQ2F2ZVNodWZmbGUoJC5NdEh5ZHJhX0NhdmU0KSxcbiAgICBuZXcgQ2F2ZVNodWZmbGUoJC5NdEh5ZHJhX0NhdmU1KSxcbiAgICBuZXcgQ2F2ZVNodWZmbGUoJC5NdEh5ZHJhX0NhdmU2KSxcbiAgICBuZXcgV2lkZUNhdmVTaHVmZmxlKCQuTXRIeWRyYV9DYXZlNyksXG4gICAgbmV3IENhdmVTaHVmZmxlKCQuTXRIeWRyYV9DYXZlOCksXG4gICAgbmV3IENhdmVTaHVmZmxlKCQuTXRIeWRyYV9DYXZlOSksXG4gICAgbmV3IENhdmVTaHVmZmxlKCQuTXRIeWRyYV9DYXZlMTApLFxuICAgIG5ldyBXaWRlQ2F2ZVNodWZmbGUoJC5TdHl4MSksXG4gICAgLy8gLy8gVE9ETyAtIGNvbnNpZGVyIHNwbGl0dGluZyB0aGlzIG1hcCwgdG9vIVxuICAgIG5ldyBTdHl4Uml2ZXJDYXZlU2h1ZmZsZSgkLlN0eXgyKS5yZXF1aXJlUGl0RGVzdGluYXRpb24oKSxcbiAgICAvLyAvL25ldyBTdHl4Uml2ZXJDYXZlU2h1ZmZsZSgkLlN0eXgyX0Vhc3QpLFxuICAgIC8vIC8vIG5ldyBTdHl4Uml2ZXJDYXZlU2h1ZmZsZSgkLlN0eXgyKSxcbiAgICBuZXcgQ2F2ZVNodWZmbGUoJC5TdHl4MyksIC8vIHBpdDogJC5TdHl4MlxuICAgIC8vIG5ldyBUb3duU2h1ZmZsZSgkLlNoeXJvbiksXG4gICAgLy8gbmV3IFRvd25TaHVmZmxlKCQuR29hKSxcbiAgICAvLyBuZXcgT3ZlcndvcmxkU2h1ZmZsZSgkLkRlc2VydDEpLFxuICAgIG5ldyBPYXNpc0NhdmVTaHVmZmxlKCQuT2FzaXNDYXZlTWFpbiksXG4gICAgbmV3IENhdmVTaHVmZmxlKCQuRGVzZXJ0Q2F2ZTEpLFxuICAgIC8vIG5ldyBUb3duU2h1ZmZsZSgkLlNhaGFyYSksXG4gICAgbmV3IENhdmVTaHVmZmxlKCQuRGVzZXJ0Q2F2ZTIpLFxuICAgIC8vIG5ldyBPdmVyd29ybGRTaHVmZmxlKCQuU2FoYXJhTWVhZG93KSxcbiAgICAvLyBuZXcgT3ZlcndvcmxkU2h1ZmZsZSgkLkRlc2VydDIpLFxuICAgIG5ldyBDYXZlU2h1ZmZsZSgkLlB5cmFtaWRfQnJhbmNoKSxcbiAgICBuZXcgUHlyYW1pZFNodWZmbGUoJC5QeXJhbWlkX01haW4pLFxuICAgIG5ldyBDcnlwdEVudHJhbmNlU2h1ZmZsZSgkLkNyeXB0X0VudHJhbmNlKSxcbiAgICBuZXcgV2lkZUNhdmVTaHVmZmxlKCQuQ3J5cHRfSGFsbDEpLFxuICAgIG5ldyBDYXZlU2h1ZmZsZSgkLkNyeXB0X0RlYWRFbmRMZWZ0KSxcbiAgICBuZXcgQ2F2ZVNodWZmbGUoJC5DcnlwdF9EZWFkRW5kUmlnaHQpLFxuICAgIG5ldyBDYXZlU2h1ZmZsZSgkLkNyeXB0X0JyYW5jaCksIC8vIGRvd246IENyeXB0X0RlYWRFbmRMZWZ0IGFuZCBEZWFkRW5kUmlnaHRcbiAgICBuZXcgQ2F2ZVNodWZmbGUoJC5DcnlwdF9IYWxsMiksIC8vIGRvd246ICQuQ3J5cHRfQnJhbmNoXG4gICAgbmV3IExhYnlyaW50aFNodWZmbGUoJC5Hb2FGb3J0cmVzc19LZWxiZXNxdWUpLFxuICAgIG5ldyBSaXZlckNhdmVTaHVmZmxlKCQuR29hRm9ydHJlc3NfU2FiZXJhKSxcbiAgICBuZXcgQ2F2ZVNodWZmbGUoJC5Hb2FGb3J0cmVzc19NYWRvMSkucmVxdWlyZVBpdERlc3RpbmF0aW9uKCksXG4gICAgbmV3IENhdmVTaHVmZmxlKCQuR29hRm9ydHJlc3NfTWFkbzIpLCAvLyBkb3duc3RhaXJzOiAkLkdvYUZvcnRyZXNzX01hZG8xXG4gICAgbmV3IENhdmVTaHVmZmxlKCQuR29hRm9ydHJlc3NfTWFkbzMpLCAvLyBkb3duc3RhaXJzOiAkLkdvYUZvcnRyZXNzX01hZG8xXG4gICAgbmV3IENhdmVTaHVmZmxlKCQuR29hRm9ydHJlc3NfS2FybWluZTEpLFxuICAgIG5ldyBDYXZlU2h1ZmZsZSgkLkdvYUZvcnRyZXNzX0thcm1pbmUyKSxcbiAgICBuZXcgQ2F2ZVNodWZmbGUoJC5Hb2FGb3J0cmVzc19LYXJtaW5lNCksXG4gICAgbmV3IEthcm1pbmVCYXNlbWVudFNodWZmbGUoJC5Hb2FGb3J0cmVzc19LYXJtaW5lNiksXG4gICAgbmV3IEthcm1pbmVVcHN0YWlyc1NodWZmbGUoJC5Hb2FGb3J0cmVzc19LYXJtaW5lMyksXG4gICAgbmV3IEthcm1pbmVNYWluU2h1ZmZsZSgkLkdvYUZvcnRyZXNzX0thcm1pbmU1KSxcbiAgICBuZXcgS2FybWluZUtlbnN1U2h1ZmZsZSgkLkdvYUZvcnRyZXNzX0tlbnN1KSxcbiAgICBuZXcgT2FzaXNFbnRyYW5jZUNhdmVTaHVmZmxlKCQuT2FzaXNDYXZlX0VudHJhbmNlKSxcbiAgICAvL25ldyBLYXJtaW5lVXBzdGFpcnNTaHVmZmxlKCQuR29hRm9ydHJlc3NfS2FybWluZTMsICQuR29hRm9ydHJlc3NfS2FybWluZTUpLFxuICAgIC8vIG5ldyBHb2FLYXJtaW5lU2h1ZmZsZSgkLkdvYUZvcnRyZXNzX0thcm1pbmUzLCAkLkdvYUZvcnRyZXNzX0thcm1pbmU1LFxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAkLkdvYUZvcnRyZXNzX0tlbnN1LCAkLkdvYUZvcnRyZXNzX0thcm1pbmU2KSxcbiAgXTtcbiAgZm9yIChjb25zdCBzaHVmZmxlIG9mIHNodWZmbGVzKSB7XG4gICAgc2h1ZmZsZS5zaHVmZmxlKHJhbmRvbSk7XG4gIH1cbiAgLy8gU2h1ZmZsZSBhbGwgdGhlIHBpdHMgYWZ0ZXJ3YXJkc1xuICBmb3IgKGNvbnN0IGxvYyBvZiAkKSB7XG4gICAgbG9jLm1ldGEuc2h1ZmZsZVBpdHMocmFuZG9tKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcHJlcGFyZVNjcmVlbnMocm9tOiBSb20sIHJhbmRvbSA9IG5ldyBSYW5kb20oMSkpIHtcbiAgd2lkZUFyZW5hRXhpdHMocm9tKTtcbiAgYWRkU3dhbXBEb29ycyhyb20pO1xuICBmaXhMYWJ5cmludGhTY3JlZW5zKHJvbSwgcmFuZG9tKTtcbn1cbiJdfQ==