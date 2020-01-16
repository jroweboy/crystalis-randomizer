import { DEBUG_MODE_FLAGS } from './flags/debug-mode.js';
import { EASY_MODE_FLAGS } from './flags/easy-mode.js';
import { GLITCH_FIX_FLAGS } from './flags/glitch-fixes.js';
import { GLITCH_FLAGS } from './flags/glitches.js';
import { HARD_MODE_FLAGS } from './flags/hard-mode.js';
import { MONSTER_FLAGS } from './flags/monsters.js';
import { ROUTING_FLAGS } from './flags/routing.js';
import { SHOP_FLAGS } from './flags/shops.js';
import { TWEAK_FLAGS } from './flags/tweaks.js';
import { WORLD_FLAGS } from './flags/world.js';
import { EXPERIMENTAL_FLAGS } from './flags/experimental.js';
import { UsageError } from './util.js';
export const PRESETS = [
    {
        title: 'Casual',
        descr: `Basic flags for a relatively easy playthrough.`,
        flags: 'Ds Edmrstux Fw Mr Rp Tab',
    },
    {
        title: 'Intermediate',
        descr: `Slightly more challenge than Casual but still approachable.`,
        flags: 'Ds Edmsu Fsw Gt Mr Ps Rpt Tab',
        default: true,
    },
    {
        title: 'Full Shuffle',
        descr: `Slightly harder than intermediate, with full shuffle and no spoiler log.`,
        flags: 'Em Fsw Gt Mert Ps Rprt Tabmp Wmtuw Xegw',
    },
    {
        title: 'Glitchless',
        descr: `Full shuffle but with no glitches.`,
        flags: 'Em Fcpstw Mert Ps Rprt Tab Wmtuw Xcegw',
    },
    {
        title: 'Advanced',
        descr: `A balanced randomization with quite a bit more difficulty.`,
        flags: 'Fsw Gfprt Hbdgw Mert Ps Roprst Tabmp Wmtuw Xcegw',
    },
    {
        title: 'Ludicrous',
        descr: `Pulls out all the stops, may require superhuman feats.`,
        flags: 'Fs Gcfprtw Hbdgmswxz Mert Ps Roprst Tabmp Wmtuw Xcegw',
    },
    {
        title: 'Mattrick',
        descr: 'Not for the faint of heart. Good luck...',
        flags: 'Fcprsw Gt Hbdhwx Mert Ps Ropst Tabmp Wmtuw',
    },
    {
        title: 'The Full Stupid',
        descr: 'Nobody has ever completed this.',
        flags: 'Fcprsw Hbdhmwxz Mert Ps Ropst Sckmt Tab Wmtuw Xcegw',
    },
    {
        title: 'Tournament: Swiss Round',
        descr: 'Quick-paced full-shuffle flags for Swiss round of 2019 Tournament',
        flags: 'Es Fcprsw Gt Hd Mr Ps Rpt Tab',
    },
    {
        title: 'Tournament: Elimination Round',
        descr: 'More thorough flags for the first elimination rounds of the 2019 Tournament',
        flags: 'Em Fprsw Gft Hbd Mer Ps Rprst Tab Wt',
    },
    {
        title: 'Tournament: Semifinals',
        descr: 'Advanced flags for semifinal round of the 2019 Tournament',
        flags: 'Em Fsw Gft Hbd Mert Ps Roprst Tab Wt',
    },
    {
        title: 'Tournament: Finals',
        descr: 'Expert flags for finals round of the 2019 Tournament',
        flags: 'Fsw Gfprt Hbdw Mert Ps Roprst Tab Wmtw',
    },
];
const PRESETS_BY_KEY = {};
for (const { title, flags } of PRESETS) {
    PRESETS_BY_KEY[`@${title.replace(/ /g, '').toLowerCase()}`] = flags;
}
export const FLAGS = [
    WORLD_FLAGS,
    EASY_MODE_FLAGS,
    MONSTER_FLAGS,
    SHOP_FLAGS,
    HARD_MODE_FLAGS,
    TWEAK_FLAGS,
    ROUTING_FLAGS,
    GLITCH_FLAGS,
    GLITCH_FIX_FLAGS,
    EXPERIMENTAL_FLAGS,
    DEBUG_MODE_FLAGS,
];
export class FlagSet {
    constructor(str = 'RtGftTab') {
        if (str.startsWith('@')) {
            const expanded = PRESETS_BY_KEY[str.toLowerCase()];
            if (!expanded)
                throw new UsageError(`Unknown preset: ${str}`);
            str = expanded;
        }
        this.flags = {};
        str = str.replace(/[^A-Za-z0-9!]/g, '');
        const re = /([A-Z])([a-z0-9!]+)/g;
        let match;
        while ((match = re.exec(str))) {
            const [, key, terms] = match;
            for (const term of terms) {
                this.set(key + term, true);
            }
        }
    }
    get(category) {
        return this.flags[category] || [];
    }
    set(flag, value) {
        const key = flag[0];
        const term = flag.substring(1);
        if (!value) {
            const filtered = (this.flags[key] || []).filter(t => t !== term);
            if (filtered.length) {
                this.flags[key] = filtered;
            }
            else {
                delete this.flags[key];
            }
            return;
        }
        this.removeConflicts(flag);
        const terms = (this.flags[key] || []).filter(t => t !== term);
        terms.push(term);
        terms.sort();
        this.flags[key] = terms;
    }
    check(flag) {
        const terms = this.flags[flag[0]];
        return !!(terms && (terms.indexOf(flag.substring(1)) >= 0));
    }
    preserveUniqueChecks() {
        return this.check('Eu');
    }
    shuffleMimics() {
        return !this.check('Et');
    }
    autoEquipBracelet() {
        return this.check('Ta');
    }
    buffDeosPendant() {
        return this.check('Tb');
    }
    changeGasMaskToHazmatSuit() {
        return this.check('Tb');
    }
    slowDownTornado() {
        return this.check('Tb');
    }
    leatherBootsGiveSpeed() {
        return this.check('Tb');
    }
    rabbitBootsChargeWhileWalking() {
        return this.check('Tb');
    }
    controllerShortcuts() {
        return !this.check('Tc');
    }
    randomizeMusic() {
        return this.check('Tm');
    }
    shuffleSpritePalettes() {
        return this.check('Tp');
    }
    shuffleMonsters() {
        return this.check('Mr');
    }
    shuffleShops() {
        return this.check('Ps');
    }
    bargainHunting() {
        return this.shuffleShops();
    }
    shuffleTowerMonsters() {
        return this.check('Mt');
    }
    shuffleMonsterElements() {
        return this.check('Me');
    }
    shuffleBossElements() {
        return this.shuffleMonsterElements();
    }
    doubleBuffMedicalHerb() {
        return this.check('Em');
    }
    buffMedicalHerb() {
        return !this.check('Hm');
    }
    decreaseEnemyDamage() {
        return this.check('Ed');
    }
    trainer() {
        return this.check('Dt');
    }
    neverDie() {
        return this.check('Di');
    }
    chargeShotsOnly() {
        return this.check('Hc');
    }
    barrierRequiresCalmSea() {
        return true;
    }
    paralysisRequiresPrisonKey() {
        return true;
    }
    sealedCaveRequiresWindmill() {
        return true;
    }
    connectLimeTreeToLeaf() {
        return this.check('Rp');
    }
    connectGoaToLeaf() {
        return this.check('Xe') && this.check('Xg');
    }
    removeEarlyWall() {
        return this.check('Xb');
    }
    zebuStudentGivesItem() {
        return !this.check('Xe') || this.check('Xc');
    }
    addEastCave() {
        return this.check('Xe');
    }
    addExtraChecksToEastCave() {
        return this.check('Xe') && this.check('Xc');
    }
    fogLampNotRequired() {
        return this.check('Xf');
    }
    storyMode() {
        return this.check('Rs');
    }
    requireHealedDolphinToRide() {
        return this.check('Rd');
    }
    saharaRabbitsRequireTelepathy() {
        return this.check('Rr');
    }
    teleportOnThunderSword() {
        return this.check('Rt');
    }
    randomizeThunderTeleport() {
        return this.check('Xw');
    }
    orbsOptional() {
        return this.check('Ro');
    }
    randomizeMaps() {
        return this.check('Wm');
    }
    randomizeTrades() {
        return this.check('Wt');
    }
    unidentifiedItems() {
        return this.check('Wu');
    }
    randomizeWalls() {
        return this.check('Ww');
    }
    guaranteeSword() {
        return this.check('Es');
    }
    guaranteeSwordMagic() {
        return !this.check('Hw');
    }
    guaranteeMatchingSword() {
        return !this.check('Hs');
    }
    guaranteeGasMask() {
        return !this.check('Hg');
    }
    guaranteeBarrier() {
        return !this.check('Hb');
    }
    guaranteeRefresh() {
        return this.check('Er');
    }
    disableSwordChargeGlitch() {
        return this.check('Fc');
    }
    disableTeleportSkip() {
        return this.check('Fp');
    }
    disableRabbitSkip() {
        return this.check('Fr');
    }
    disableShopGlitch() {
        return this.check('Fs');
    }
    disableStatueGlitch() {
        return this.check('Ft');
    }
    disableFlightStatueSkip() {
        return false;
    }
    assumeSwordChargeGlitch() {
        return this.check('Gc');
    }
    assumeGhettoFlight() {
        return this.check('Gf');
    }
    assumeTeleportSkip() {
        return this.check('Gp');
    }
    assumeRabbitSkip() {
        return this.check('Gr');
    }
    assumeStatueGlitch() {
        return this.check('Gt');
    }
    assumeTriggerGlitch() {
        return false;
    }
    assumeFlightStatueSkip() {
        return false;
    }
    assumeWildWarp() {
        return this.check('Gw');
    }
    assumeRageSkip() {
        return false;
    }
    nerfWildWarp() {
        return this.check('Fw');
    }
    allowWildWarp() {
        return !this.nerfWildWarp();
    }
    randomizeWildWarp() {
        return this.check('Tw');
    }
    blackoutMode() {
        return this.check('Hz');
    }
    hardcoreMode() {
        return this.check('Hh');
    }
    buffDyna() {
        return this.check('Hd');
    }
    expScalingFactor() {
        return this.check('Hx') ? 0.25 : this.check('Ex') ? 2.5 : 1;
    }
    removeConflicts(flag) {
        const re = this.exclusiveFlags(flag);
        if (!re)
            return;
        for (const key in this.flags) {
            if (!this.flags.hasOwnProperty(key))
                continue;
            const terms = this.flags[key].filter(t => !re.test(key + t));
            if (terms.length) {
                this.flags[key] = terms;
            }
            else {
                delete this.flags[key];
            }
        }
    }
    toStringKey(key) {
        return key + [...this.flags[key]].sort().join('');
    }
    exclusiveFlags(flag) {
        const flagForName = this.getFlagForName(flag);
        if (flagForName == null)
            throw new Error(`Unknown flag: ${flag}`);
        return flagForName.conflict;
    }
    getFlagForName(flag) {
        const matchingFlagSection = FLAGS.find(flagSection => {
            return flag.startsWith(flagSection.prefix);
        });
        if (!matchingFlagSection)
            return undefined;
        return matchingFlagSection.flags
            .find(flagToMatch => flagToMatch.flag === flag);
    }
    toString() {
        const keys = Object.keys(this.flags);
        keys.sort();
        return keys.map(k => this.toStringKey(k)).join(' ');
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmxhZ3NldC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9qcy9mbGFnc2V0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBQyxnQkFBZ0IsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ3ZELE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUVyRCxPQUFPLEVBQUMsZ0JBQWdCLEVBQUMsTUFBTSx5QkFBeUIsQ0FBQztBQUN6RCxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDakQsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQ3JELE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNsRCxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFDakQsT0FBTyxFQUFDLFVBQVUsRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBQzVDLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUM5QyxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFDN0MsT0FBTyxFQUFDLGtCQUFrQixFQUFDLE1BQU0seUJBQXlCLENBQUM7QUFDM0QsT0FBTyxFQUFDLFVBQVUsRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUVyQyxNQUFNLENBQUMsTUFBTSxPQUFPLEdBQWE7SUFDL0I7UUFDRSxLQUFLLEVBQUUsUUFBUTtRQUNmLEtBQUssRUFBRSxnREFBZ0Q7UUFDdkQsS0FBSyxFQUFFLDBCQUEwQjtLQUNsQztJQUNEO1FBQ0UsS0FBSyxFQUFFLGNBQWM7UUFDckIsS0FBSyxFQUFFLDZEQUE2RDtRQUNwRSxLQUFLLEVBQUUsK0JBQStCO1FBQ3RDLE9BQU8sRUFBRSxJQUFJO0tBQ2Q7SUFDRDtRQUNFLEtBQUssRUFBRSxjQUFjO1FBQ3JCLEtBQUssRUFDRCwwRUFBMEU7UUFDOUUsS0FBSyxFQUFFLHlD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Q0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ3RELENBQUM7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7REVCVUdfTU9ERV9GTEFHU30gZnJvbSAnLi9mbGFncy9kZWJ1Zy1tb2RlLmpzJztcbmltcG9ydCB7RUFTWV9NT0RFX0ZMQUdTfSBmcm9tICcuL2ZsYWdzL2Vhc3ktbW9kZS5qcyc7XG5pbXBvcnQge0ZsYWcsIEZsYWdTZWN0aW9uLCBQcmVzZXR9IGZyb20gJy4vZmxhZ3MvZmxhZy5qcyc7XG5pbXBvcnQge0dMSVRDSF9GSVhfRkxBR1N9IGZyb20gJy4vZmxhZ3MvZ2xpdGNoLWZpeGVzLmpzJztcbmltcG9ydCB7R0xJVENIX0ZMQUdTfSBmcm9tICcuL2ZsYWdzL2dsaXRjaGVzLmpzJztcbmltcG9ydCB7SEFSRF9NT0RFX0ZMQUdTfSBmcm9tICcuL2ZsYWdzL2hhcmQtbW9kZS5qcyc7XG5pbXBvcnQge01PTlNURVJfRkxBR1N9IGZyb20gJy4vZmxhZ3MvbW9uc3RlcnMuanMnO1xuaW1wb3J0IHtST1VUSU5HX0ZMQUdTfSBmcm9tICcuL2ZsYWdzL3JvdXRpbmcuanMnO1xuaW1wb3J0IHtTSE9QX0ZMQUdTfSBmcm9tICcuL2ZsYWdzL3Nob3BzLmpzJztcbmltcG9ydCB7VFdFQUtfRkxBR1N9IGZyb20gJy4vZmxhZ3MvdHdlYWtzLmpzJztcbmltcG9ydCB7V09STERfRkxBR1N9IGZyb20gJy4vZmxhZ3Mvd29ybGQuanMnO1xuaW1wb3J0IHtFWFBFUklNRU5UQUxfRkxBR1N9IGZyb20gJy4vZmxhZ3MvZXhwZXJpbWVudGFsLmpzJztcbmltcG9ydCB7VXNhZ2VFcnJvcn0gZnJvbSAnLi91dGlsLmpzJztcblxuZXhwb3J0IGNvbnN0IFBSRVNFVFM6IFByZXNldFtdID0gW1xuICB7XG4gICAgdGl0bGU6ICdDYXN1YWwnLFxuICAgIGRlc2NyOiBgQmFzaWMgZmxhZ3MgZm9yIGEgcmVsYXRpdmVseSBlYXN5IHBsYXl0aHJvdWdoLmAsXG4gICAgZmxhZ3M6ICdEcyBFZG1yc3R1eCBGdyBNciBScCBUYWInLFxuICB9LFxuICB7XG4gICAgdGl0bGU6ICdJbnRlcm1lZGlhdGUnLFxuICAgIGRlc2NyOiBgU2xpZ2h0bHkgbW9yZSBjaGFsbGVuZ2UgdGhhbiBDYXN1YWwgYnV0IHN0aWxsIGFwcHJvYWNoYWJsZS5gLFxuICAgIGZsYWdzOiAnRHMgRWRtc3UgRnN3IEd0IE1yIFBzIFJwdCBUYWInLFxuICAgIGRlZmF1bHQ6IHRydWUsXG4gIH0sXG4gIHtcbiAgICB0aXRsZTogJ0Z1bGwgU2h1ZmZsZScsXG4gICAgZGVzY3I6XG4gICAgICAgIGBTbGlnaHRseSBoYXJkZXIgdGhhbiBpbnRlcm1lZGlhdGUsIHdpdGggZnVsbCBzaHVmZmxlIGFuZCBubyBzcG9pbGVyIGxvZy5gLFxuICAgIGZsYWdzOiAnRW0gRnN3IEd0IE1lcnQgUHMgUnBydCBUYWJtcCBXbXR1dyBYZWd3JyxcbiAgfSxcbiAge1xuICAgIHRpdGxlOiAnR2xpdGNobGVzcycsXG4gICAgZGVzY3I6IGBGdWxsIHNodWZmbGUgYnV0IHdpdGggbm8gZ2xpdGNoZXMuYCxcbiAgICBmbGFnczogJ0VtIEZjcHN0dyBNZXJ0IFBzIFJwcnQgVGFiIFdtdHV3IFhjZWd3JyxcbiAgfSxcbiAge1xuICAgIC8vIFRPRE86IGFkZCAnSHQnIGZvciBtYXhpbmcgb3V0IHRvd2VyIHNjYWxpbmdcbiAgICB0aXRsZTogJ0FkdmFuY2VkJyxcbiAgICBkZXNjcjogYEEgYmFsYW5jZWQgcmFuZG9taXphdGlvbiB3aXRoIHF1aXRlIGEgYml0IG1vcmUgZGlmZmljdWx0eS5gLFxuICAgIGZsYWdzOiAnRnN3IEdmcHJ0IEhiZGd3IE1lcnQgUHMgUm9wcnN0IFRhYm1wIFdtdHV3IFhjZWd3JyxcbiAgfSxcbiAge1xuICAgIC8vIFRPRE86IGFkZCAnSHQnXG4gICAgdGl0bGU6ICdMdWRpY3JvdXMnLFxuICAgIGRlc2NyOiBgUHVsbHMgb3V0IGFsbCB0aGUgc3RvcHMsIG1heSByZXF1aXJlIHN1cGVyaHVtYW4gZmVhdHMuYCxcbiAgICBmbGFnczogJ0ZzIEdjZnBydHcgSGJkZ21zd3h6IE1lcnQgUHMgUm9wcnN0IFRhYm1wIFdtdHV3IFhjZWd3JyxcbiAgfSxcbiAge1xuICAgIHRpdGxlOiAnTWF0dHJpY2snLFxuICAgIGRlc2NyOiAnTm90IGZvciB0aGUgZmFpbnQgb2YgaGVhcnQuIEdvb2QgbHVjay4uLicsXG4gICAgZmxhZ3M6ICdGY3Byc3cgR3QgSGJkaHd4IE1lcnQgUHMgUm9wc3QgVGFibXAgV210dXcnLFxuICB9LFxuICB7XG4gICAgdGl0bGU6ICdUaGUgRnVsbCBTdHVwaWQnLFxuICAgIGRlc2NyOiAnTm9ib2R5IGhhcyBldmVyIGNvbXBsZXRlZCB0aGlzLicsXG4gICAgZmxhZ3M6ICdGY3Byc3cgSGJkaG13eHogTWVydCBQcyBSb3BzdCBTY2ttdCBUYWIgV210dXcgWGNlZ3cnLFxuICB9LFxuICAvLyBUT1VSTkFNRU5UIFBSRVNFVFNcbiAge1xuICAgIHRpdGxlOiAnVG91cm5hbWVudDogU3dpc3MgUm91bmQnLFxuICAgIGRlc2NyOiAnUXVpY2stcGFjZWQgZnVsbC1zaHVmZmxlIGZsYWdzIGZvciBTd2lzcyByb3VuZCBvZiAyMDE5IFRvdXJuYW1lbnQnLFxuICAgIGZsYWdzOiAnRXMgRmNwcnN3IEd0IEhkIE1yIFBzIFJwdCBUYWInLFxuICB9LFxuICB7XG4gICAgdGl0bGU6ICdUb3VybmFtZW50OiBFbGltaW5hdGlvbiBSb3VuZCcsXG4gICAgZGVzY3I6ICdNb3JlIHRob3JvdWdoIGZsYWdzIGZvciB0aGUgZmlyc3QgZWxpbWluYXRpb24gcm91bmRzIG9mIHRoZSAyMDE5IFRvdXJuYW1lbnQnLFxuICAgIGZsYWdzOiAnRW0gRnByc3cgR2Z0IEhiZCBNZXIgUHMgUnByc3QgVGFiIFd0JyxcbiAgfSxcbiAge1xuICAgIHRpdGxlOiAnVG91cm5hbWVudDogU2VtaWZpbmFscycsXG4gICAgZGVzY3I6ICdBZHZhbmNlZCBmbGFncyBmb3Igc2VtaWZpbmFsIHJvdW5kIG9mIHRoZSAyMDE5IFRvdXJuYW1lbnQnLFxuICAgIGZsYWdzOiAnRW0gRnN3IEdmdCBIYmQgTWVydCBQcyBSb3Byc3QgVGFiIFd0JyxcbiAgfSxcbiAge1xuICAgIHRpdGxlOiAnVG91cm5hbWVudDogRmluYWxzJyxcbiAgICBkZXNjcjogJ0V4cGVydCBmbGFncyBmb3IgZmluYWxzIHJvdW5kIG9mIHRoZSAyMDE5IFRvdXJuYW1lbnQnLFxuICAgIGZsYWdzOiAnRnN3IEdmcHJ0IEhiZHcgTWVydCBQcyBSb3Byc3QgVGFiIFdtdHcnLFxuICB9LFxuXTtcblxuLy8gSnVzdCB0aGUgZmxhZ3MsIG5vdCB0aGUgd2hvbGUgZG9jdW1lbnRhdGlvbi5cbmNvbnN0IFBSRVNFVFNfQllfS0VZOiB7W2tleTogc3RyaW5nXTogc3RyaW5nfSA9IHt9O1xuZm9yIChjb25zdCB7dGl0bGUsIGZsYWdzfSBvZiBQUkVTRVRTKSB7XG4gIFBSRVNFVFNfQllfS0VZW2BAJHt0aXRsZS5yZXBsYWNlKC8gL2csICcnKS50b0xvd2VyQ2FzZSgpfWBdID0gZmxhZ3M7XG59XG5cbmV4cG9ydCBjb25zdCBGTEFHUzogRmxhZ1NlY3Rpb25bXSA9IFtcbiAgV09STERfRkxBR1MsXG4gIEVBU1lfTU9ERV9GTEFHUyxcbiAgTU9OU1RFUl9GTEFHUyxcbiAgU0hPUF9GTEFHUyxcbiAgSEFSRF9NT0RFX0ZMQUdTLFxuICBUV0VBS19GTEFHUyxcbiAgUk9VVElOR19GTEFHUyxcbiAgR0xJVENIX0ZMQUdTLFxuICBHTElUQ0hfRklYX0ZMQUdTLFxuICBFWFBFUklNRU5UQUxfRkxBR1MsXG4gIERFQlVHX01PREVfRkxBR1MsXG5dO1xuXG5leHBvcnQgY2xhc3MgRmxhZ1NldCB7XG4gIHByaXZhdGUgZmxhZ3M6IHtbc2VjdGlvbjogc3RyaW5nXTogc3RyaW5nW119O1xuXG4gIGNvbnN0cnVjdG9yKHN0ciA9ICdSdEdmdFRhYicpIHtcbiAgICBpZiAoc3RyLnN0YXJ0c1dpdGgoJ0AnKSkge1xuICAgICAgY29uc3QgZXhwYW5kZWQgPSBQUkVTRVRTX0JZX0tFWVtzdHIudG9Mb3dlckNhc2UoKV07XG4gICAgICBpZiAoIWV4cGFuZGVkKSB0aHJvdyBuZXcgVXNhZ2VFcnJvcihgVW5rbm93biBwcmVzZXQ6ICR7c3RyfWApO1xuICAgICAgc3RyID0gZXhwYW5kZWQ7XG4gICAgfVxuICAgIHRoaXMuZmxhZ3MgPSB7fTtcbiAgICAvLyBwYXJzZSB0aGUgc3RyaW5nXG4gICAgc3RyID0gc3RyLnJlcGxhY2UoL1teQS1aYS16MC05IV0vZywgJycpO1xuICAgIGNvbnN0IHJlID0gLyhbQS1aXSkoW2EtejAtOSFdKykvZztcbiAgICBsZXQgbWF0Y2g7XG4gICAgd2hpbGUgKChtYXRjaCA9IHJlLmV4ZWMoc3RyKSkpIHtcbiAgICAgIGNvbnN0IFssIGtleSwgdGVybXNdID0gbWF0Y2g7XG4gICAgICBmb3IgKGNvbnN0IHRlcm0gb2YgdGVybXMpIHtcbiAgICAgICAgdGhpcy5zZXQoa2V5ICsgdGVybSwgdHJ1ZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZ2V0KGNhdGVnb3J5OiBzdHJpbmcpOiBzdHJpbmdbXSB7XG4gICAgcmV0dXJuIHRoaXMuZmxhZ3NbY2F0ZWdvcnldIHx8IFtdO1xuICB9XG5cbiAgc2V0KGZsYWc6IHN0cmluZywgdmFsdWU6IGJvb2xlYW4pIHtcbiAgICAvLyBjaGVjayBmb3IgaW5jb21wYXRpYmxlIGZsYWdzLi4uP1xuICAgIGNvbnN0IGtleSA9IGZsYWdbMF07XG4gICAgY29uc3QgdGVybSA9IGZsYWcuc3Vic3RyaW5nKDEpOyAgLy8gYXNzZXJ0OiB0ZXJtIGlzIG9ubHkgbGV0dGVycy9udW1iZXJzXG4gICAgaWYgKCF2YWx1ZSkge1xuICAgICAgLy8gSnVzdCBkZWxldGUgLSB0aGF0J3MgZWFzeS5cbiAgICAgIGNvbnN0IGZpbHRlcmVkID0gKHRoaXMuZmxhZ3Nba2V5XSB8fCBbXSkuZmlsdGVyKHQgPT4gdCAhPT0gdGVybSk7XG4gICAgICBpZiAoZmlsdGVyZWQubGVuZ3RoKSB7XG4gICAgICAgIHRoaXMuZmxhZ3Nba2V5XSA9IGZpbHRlcmVkO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZGVsZXRlIHRoaXMuZmxhZ3Nba2V5XTtcbiAgICAgIH1cbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgLy8gQWN0dWFsbHkgYWRkIHRoZSBmbGFnLlxuICAgIHRoaXMucmVtb3ZlQ29uZmxpY3RzKGZsYWcpO1xuICAgIGNvbnN0IHRlcm1zID0gKHRoaXMuZmxhZ3Nba2V5XSB8fCBbXSkuZmlsdGVyKHQgPT4gdCAhPT0gdGVybSk7XG4gICAgdGVybXMucHVzaCh0ZXJtKTtcbiAgICB0ZXJtcy5zb3J0KCk7XG4gICAgdGhpcy5mbGFnc1trZXldID0gdGVybXM7XG4gIH1cblxuICBjaGVjayhmbGFnOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICBjb25zdCB0ZXJtcyA9IHRoaXMuZmxhZ3NbZmxhZ1swXV07XG4gICAgcmV0dXJuICEhKHRlcm1zICYmICh0ZXJtcy5pbmRleE9mKGZsYWcuc3Vic3RyaW5nKDEpKSA+PSAwKSk7XG4gIH1cblxuICBwcmVzZXJ2ZVVuaXF1ZUNoZWNrcygpIHtcbiAgICByZXR1cm4gdGhpcy5jaGVjaygnRXUnKTtcbiAgfVxuICBzaHVmZmxlTWltaWNzKCkge1xuICAgIHJldHVybiAhdGhpcy5jaGVjaygnRXQnKTtcbiAgfVxuXG4gIGF1dG9FcXVpcEJyYWNlbGV0KCkge1xuICAgIHJldHVybiB0aGlzLmNoZWNrKCdUYScpO1xuICB9XG4gIGJ1ZmZEZW9zUGVuZGFudCgpIHtcbiAgICByZXR1cm4gdGhpcy5jaGVjaygnVGInKTtcbiAgfVxuICBjaGFuZ2VHYXNNYXNrVG9IYXptYXRTdWl0KCkge1xuICAgIHJldHVybiB0aGlzLmNoZWNrKCdUYicpO1xuICB9XG4gIHNsb3dEb3duVG9ybmFkbygpIHtcbiAgICByZXR1cm4gdGhpcy5jaGVjaygnVGInKTtcbiAgfVxuICBsZWF0aGVyQm9vdHNHaXZlU3BlZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuY2hlY2soJ1RiJyk7XG4gIH1cbiAgcmFiYml0Qm9vdHNDaGFyZ2VXaGlsZVdhbGtpbmcoKSB7XG4gICAgcmV0dXJuIHRoaXMuY2hlY2soJ1RiJyk7XG4gIH1cbiAgY29udHJvbGxlclNob3J0Y3V0cygpIHtcbiAgICByZXR1cm4gIXRoaXMuY2hlY2soJ1RjJyk7XG4gIH1cbiAgcmFuZG9taXplTXVzaWMoKSB7XG4gICAgcmV0dXJuIHRoaXMuY2hlY2soJ1RtJyk7XG4gIH1cbiAgc2h1ZmZsZVNwcml0ZVBhbGV0dGVzKCkge1xuICAgIHJldHVybiB0aGlzLmNoZWNrKCdUcCcpO1xuICB9XG5cbiAgc2h1ZmZsZU1vbnN0ZXJzKCkge1xuICAgIHJldHVybiB0aGlzLmNoZWNrKCdNcicpO1xuICB9XG4gIHNodWZmbGVTaG9wcygpIHtcbiAgICByZXR1cm4gdGhpcy5jaGVjaygnUHMnKTtcbiAgfVxuICBiYXJnYWluSHVudGluZygpIHtcbiAgICByZXR1cm4gdGhpcy5zaHVmZmxlU2hvcHMoKTtcbiAgfVxuXG4gIHNodWZmbGVUb3dlck1vbnN0ZXJzKCkge1xuICAgIHJldHVybiB0aGlzLmNoZWNrKCdNdCcpO1xuICB9XG4gIHNodWZmbGVNb25zdGVyRWxlbWVudHMoKSB7XG4gICAgcmV0dXJuIHRoaXMuY2hlY2soJ01lJyk7XG4gIH1cbiAgc2h1ZmZsZUJvc3NFbGVtZW50cygpIHtcbiAgICByZXR1cm4gdGhpcy5zaHVmZmxlTW9uc3RlckVsZW1lbnRzKCk7XG4gIH1cblxuICBkb3VibGVCdWZmTWVkaWNhbEhlcmIoKSB7XG4gICAgcmV0dXJuIHRoaXMuY2hlY2soJ0VtJyk7XG4gIH1cbiAgYnVmZk1lZGljYWxIZXJiKCkge1xuICAgIHJldHVybiAhdGhpcy5jaGVjaygnSG0nKTtcbiAgfVxuICBkZWNyZWFzZUVuZW15RGFtYWdlKCkge1xuICAgIHJldHVybiB0aGlzLmNoZWNrKCdFZCcpO1xuICB9XG4gIHRyYWluZXIoKSB7XG4gICAgcmV0dXJuIHRoaXMuY2hlY2soJ0R0Jyk7XG4gIH1cbiAgbmV2ZXJEaWUoKSB7XG4gICAgcmV0dXJuIHRoaXMuY2hlY2soJ0RpJyk7XG4gIH1cbiAgY2hhcmdlU2hvdHNPbmx5KCkge1xuICAgIHJldHVybiB0aGlzLmNoZWNrKCdIYycpO1xuICB9XG5cbiAgYmFycmllclJlcXVpcmVzQ2FsbVNlYSgpIHtcbiAgICByZXR1cm4gdHJ1ZTsgLy8gdGhpcy5jaGVjaygnUmwnKTtcbiAgfVxuICBwYXJhbHlzaXNSZXF1aXJlc1ByaXNvbktleSgpIHtcbiAgICByZXR1cm4gdHJ1ZTsgLy8gdGhpcy5jaGVjaygnUmwnKTtcbiAgfVxuICBzZWFsZWRDYXZlUmVxdWlyZXNXaW5kbWlsbCgpIHtcbiAgICByZXR1cm4gdHJ1ZTsgLy8gdGhpcy5jaGVjaygnUmwnKTtcbiAgfVxuICBjb25uZWN0TGltZVRyZWVUb0xlYWYoKSB7XG4gICAgcmV0dXJuIHRoaXMuY2hlY2soJ1JwJyk7XG4gIH1cbiAgY29ubmVjdEdvYVRvTGVhZigpIHtcbiAgICByZXR1cm4gdGhpcy5jaGVjaygnWGUnKSAmJiB0aGlzLmNoZWNrKCdYZycpO1xuICB9XG4gIHJlbW92ZUVhcmx5V2FsbCgpIHtcbiAgICByZXR1cm4gdGhpcy5jaGVjaygnWGInKTtcbiAgfVxuICB6ZWJ1U3R1ZGVudEdpdmVzSXRlbSgpIHtcbiAgICByZXR1cm4gIXRoaXMuY2hlY2soJ1hlJykgfHwgdGhpcy5jaGVjaygnWGMnKTtcbiAgfVxuICBhZGRFYXN0Q2F2ZSgpIHtcbiAgICByZXR1cm4gdGhpcy5jaGVjaygnWGUnKTtcbiAgfVxuICBhZGRFeHRyYUNoZWNrc1RvRWFzdENhdmUoKSB7XG4gICAgcmV0dXJuIHRoaXMuY2hlY2soJ1hlJykgJiYgdGhpcy5jaGVjaygnWGMnKTtcbiAgfVxuICBmb2dMYW1wTm90UmVxdWlyZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuY2hlY2soJ1hmJyk7XG4gIH1cbiAgc3RvcnlNb2RlKCkge1xuICAgIHJldHVybiB0aGlzLmNoZWNrKCdScycpO1xuICB9XG4gIHJlcXVpcmVIZWFsZWREb2xwaGluVG9SaWRlKCkge1xuICAgIHJldHVybiB0aGlzLmNoZWNrKCdSZCcpO1xuICB9XG4gIHNhaGFyYVJhYmJpdHNSZXF1aXJlVGVsZXBhdGh5KCkge1xuICAgIHJldHVybiB0aGlzLmNoZWNrKCdScicpO1xuICB9XG4gIHRlbGVwb3J0T25UaHVuZGVyU3dvcmQoKSB7XG4gICAgcmV0dXJuIHRoaXMuY2hlY2soJ1J0Jyk7XG4gIH1cbiAgcmFuZG9taXplVGh1bmRlclRlbGVwb3J0KCkge1xuICAgIHJldHVybiB0aGlzLmNoZWNrKCdYdycpO1xuICB9XG4gIG9yYnNPcHRpb25hbCgpIHtcbiAgICByZXR1cm4gdGhpcy5jaGVjaygnUm8nKTtcbiAgfVxuXG4gIHJhbmRvbWl6ZU1hcHMoKSB7XG4gICAgcmV0dXJuIHRoaXMuY2hlY2soJ1dtJyk7XG4gIH1cbiAgcmFuZG9taXplVHJhZGVzKCkge1xuICAgIHJldHVybiB0aGlzLmNoZWNrKCdXdCcpO1xuICB9XG4gIHVuaWRlbnRpZmllZEl0ZW1zKCkge1xuICAgIHJldHVybiB0aGlzLmNoZWNrKCdXdScpO1xuICB9XG4gIHJhbmRvbWl6ZVdhbGxzKCkge1xuICAgIHJldHVybiB0aGlzLmNoZWNrKCdXdycpO1xuICB9XG5cbiAgZ3VhcmFudGVlU3dvcmQoKSB7XG4gICAgcmV0dXJuIHRoaXMuY2hlY2soJ0VzJyk7XG4gIH1cbiAgZ3VhcmFudGVlU3dvcmRNYWdpYygpIHtcbiAgICByZXR1cm4gIXRoaXMuY2hlY2soJ0h3Jyk7XG4gIH1cbiAgZ3VhcmFudGVlTWF0Y2hpbmdTd29yZCgpIHtcbiAgICByZXR1cm4gIXRoaXMuY2hlY2soJ0hzJyk7XG4gIH1cbiAgZ3VhcmFudGVlR2FzTWFzaygpIHtcbiAgICByZXR1cm4gIXRoaXMuY2hlY2soJ0hnJyk7XG4gIH1cbiAgZ3VhcmFudGVlQmFycmllcigpIHtcbiAgICByZXR1cm4gIXRoaXMuY2hlY2soJ0hiJyk7XG4gIH1cbiAgZ3VhcmFudGVlUmVmcmVzaCgpIHtcbiAgICByZXR1cm4gdGhpcy5jaGVjaygnRXInKTtcbiAgfVxuXG4gIGRpc2FibGVTd29yZENoYXJnZUdsaXRjaCgpIHtcbiAgICByZXR1cm4gdGhpcy5jaGVjaygnRmMnKTtcbiAgfVxuICBkaXNhYmxlVGVsZXBvcnRTa2lwKCkge1xuICAgIHJldHVybiB0aGlzLmNoZWNrKCdGcCcpO1xuICB9XG4gIGRpc2FibGVSYWJiaXRTa2lwKCkge1xuICAgIHJldHVybiB0aGlzLmNoZWNrKCdGcicpO1xuICB9XG4gIGRpc2FibGVTaG9wR2xpdGNoKCkge1xuICAgIHJldHVybiB0aGlzLmNoZWNrKCdGcycpO1xuICB9XG4gIGRpc2FibGVTdGF0dWVHbGl0Y2goKSB7XG4gICAgcmV0dXJuIHRoaXMuY2hlY2soJ0Z0Jyk7XG4gIH1cbiAgZGlzYWJsZUZsaWdodFN0YXR1ZVNraXAoKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgYXNzdW1lU3dvcmRDaGFyZ2VHbGl0Y2goKSB7XG4gICAgcmV0dXJuIHRoaXMuY2hlY2soJ0djJyk7XG4gIH1cbiAgYXNzdW1lR2hldHRvRmxpZ2h0KCkge1xuICAgIHJldHVybiB0aGlzLmNoZWNrKCdHZicpO1xuICB9XG4gIGFzc3VtZVRlbGVwb3J0U2tpcCgpIHtcbiAgICByZXR1cm4gdGhpcy5jaGVjaygnR3AnKTtcbiAgfVxuICBhc3N1bWVSYWJiaXRTa2lwKCkge1xuICAgIHJldHVybiB0aGlzLmNoZWNrKCdHcicpO1xuICB9XG4gIGFzc3VtZVN0YXR1ZUdsaXRjaCgpIHtcbiAgICByZXR1cm4gdGhpcy5jaGVjaygnR3QnKTtcbiAgfVxuICBhc3N1bWVUcmlnZ2VyR2xpdGNoKCkge1xuICAgIHJldHVybiBmYWxzZTsgLy8gVE9ETyAtIG9ubHkgd29ya3Mgb24gbGFuZD9cbiAgfVxuICBhc3N1bWVGbGlnaHRTdGF0dWVTa2lwKCkge1xuICAgIHJldHVybiBmYWxzZTsgLy8gVE9ETyAtIGFsbG93IGEgZmxhZyB0byBkaXNhYmxlXG4gIH1cbiAgYXNzdW1lV2lsZFdhcnAoKSB7XG4gICAgcmV0dXJuIHRoaXMuY2hlY2soJ0d3Jyk7XG4gIH1cbiAgYXNzdW1lUmFnZVNraXAoKSB7XG4gICAgcmV0dXJuIGZhbHNlOyAvLyBUT0RPIC0gbmVlZCB0byBjaGVjayBmb3IgYSBmbHllciB0byB0aGUgc291dGg/XG4gIH1cblxuICBuZXJmV2lsZFdhcnAoKSB7XG4gICAgcmV0dXJuIHRoaXMuY2hlY2soJ0Z3Jyk7XG4gIH1cbiAgYWxsb3dXaWxkV2FycCgpIHtcbiAgICByZXR1cm4gIXRoaXMubmVyZldpbGRXYXJwKCk7XG4gIH1cbiAgcmFuZG9taXplV2lsZFdhcnAoKSB7XG4gICAgcmV0dXJuIHRoaXMuY2hlY2soJ1R3Jyk7XG4gIH1cblxuICBibGFja291dE1vZGUoKSB7XG4gICAgcmV0dXJuIHRoaXMuY2hlY2soJ0h6Jyk7XG4gIH1cbiAgaGFyZGNvcmVNb2RlKCkge1xuICAgIHJldHVybiB0aGlzLmNoZWNrKCdIaCcpO1xuICB9XG4gIGJ1ZmZEeW5hKCkge1xuICAgIHJldHVybiB0aGlzLmNoZWNrKCdIZCcpO1xuICB9XG5cbiAgZXhwU2NhbGluZ0ZhY3RvcigpIHtcbiAgICByZXR1cm4gdGhpcy5jaGVjaygnSHgnKSA/IDAuMjUgOiB0aGlzLmNoZWNrKCdFeCcpID8gMi41IDogMTtcbiAgfVxuXG4gIC8vIFRoZSBmb2xsb3dpbmcgZGlkbid0IGVuZCB1cCBnZXR0aW5nIHVzZWQuXG5cbiAgLy8gYWxsb3dzKGZsYWcpIHtcbiAgLy8gICBjb25zdCByZSA9IGV4Y2x1c2l2ZUZsYWdzKGZsYWcpO1xuICAvLyAgIGlmICghcmUpIHJldHVybiB0cnVlO1xuICAvLyAgIGZvciAoY29uc3Qga2V5IGluIHRoaXMuZmxhZ3MpIHtcbiAgLy8gICAgIGlmICh0aGlzLmZsYWdzW2tleV0uZmluZCh0ID0+IHJlLnRlc3Qoa2V5ICsgdCkpKSByZXR1cm4gZmFsc2U7XG4gIC8vICAgfVxuICAvLyAgIHJldHVybiB0cnVlO1xuICAvLyB9XG5cbiAgLy8gbWVyZ2UodGhhdCkge1xuICAvLyAgIHRoaXMuZmxhZ3MgPSB0aGF0LmZsYWdzO1xuICAvLyB9XG5cbiAgcHJpdmF0ZSByZW1vdmVDb25mbGljdHMoZmxhZzogc3RyaW5nKSB7XG4gICAgLy8gTk9URTogdGhpcyBpcyBzb21ld2hhdCByZWR1bmRhbnQgd2l0aCBzZXQoZmxhZywgZmFsc2UpXG4gICAgY29uc3QgcmUgPSB0aGlzLmV4Y2x1c2l2ZUZsYWdzKGZsYWcpO1xuICAgIGlmICghcmUpIHJldHVybjtcbiAgICBmb3IgKGNvbnN0IGtleSBpbiB0aGlzLmZsYWdzKSB7XG4gICAgICBpZiAoIXRoaXMuZmxhZ3MuaGFzT3duUHJvcGVydHkoa2V5KSkgY29udGludWU7XG4gICAgICBjb25zdCB0ZXJtcyA9IHRoaXMuZmxhZ3Nba2V5XS5maWx0ZXIodCA9PiAhcmUudGVzdChrZXkgKyB0KSk7XG4gICAgICBpZiAodGVybXMubGVuZ3RoKSB7XG4gICAgICAgIHRoaXMuZmxhZ3Nba2V5XSA9IHRlcm1zO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZGVsZXRlIHRoaXMuZmxhZ3Nba2V5XTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHRvU3RyaW5nS2V5KGtleTogc3RyaW5nKSB7XG4gICAgcmV0dXJuIGtleSArIFsuLi50aGlzLmZsYWdzW2tleV1dLnNvcnQoKS5qb2luKCcnKTtcbiAgfVxuXG4gIHByaXZhdGUgZXhjbHVzaXZlRmxhZ3MoZmxhZzogc3RyaW5nKTogUmVnRXhwfHVuZGVmaW5lZCB7XG4gICAgY29uc3QgZmxhZ0Zvck5hbWUgPSB0aGlzLmdldEZsYWdGb3JOYW1lKGZsYWcpO1xuICAgIGlmIChmbGFnRm9yTmFtZSA9PSBudWxsKSB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gZmxhZzogJHtmbGFnfWApO1xuICAgIHJldHVybiBmbGFnRm9yTmFtZS5jb25mbGljdDtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0RmxhZ0Zvck5hbWUoZmxhZzogc3RyaW5nKTogRmxhZ3x1bmRlZmluZWQge1xuICAgIGNvbnN0IG1hdGNoaW5nRmxhZ1NlY3Rpb24gPSBGTEFHUy5maW5kKGZsYWdTZWN0aW9uID0+IHtcbiAgICAgIHJldHVybiBmbGFnLnN0YXJ0c1dpdGgoZmxhZ1NlY3Rpb24ucHJlZml4KTtcbiAgICB9KTtcbiAgICBpZiAoIW1hdGNoaW5nRmxhZ1NlY3Rpb24pIHJldHVybiB1bmRlZmluZWQ7XG4gICAgcmV0dXJuIG1hdGNoaW5nRmxhZ1NlY3Rpb24uZmxhZ3NcbiAgICAgICAgLmZpbmQoZmxhZ1RvTWF0Y2ggPT4gZmxhZ1RvTWF0Y2guZmxhZyA9PT0gZmxhZyk7XG4gIH1cblxuICB0b1N0cmluZygpIHtcbiAgICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXModGhpcy5mbGFncyk7XG4gICAga2V5cy5zb3J0KCk7XG4gICAgcmV0dXJuIGtleXMubWFwKGsgPT4gdGhpcy50b1N0cmluZ0tleShrKSkuam9pbignICcpO1xuICB9XG59XG4iXX0=