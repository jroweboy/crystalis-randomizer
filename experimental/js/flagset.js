import { DEBUG_MODE_FLAGS } from './flags/debug-mode.js';
import { EASY_MODE_FLAGS } from './flags/easy-mode.js';
import { GLITCH_FIX_FLAGS } from './flags/glitch-fixes.js';
import { GLITCH_FLAGS } from './flags/glitches.js';
import { HARD_MODE_FLAGS } from './flags/hard-mode.js';
import { ITEM_FLAGS } from './flags/items.js';
import { MONSTER_FLAGS } from './flags/monsters.js';
import { ROUTING_FLAGS } from './flags/routing.js';
import { SHOP_FLAGS } from './flags/shops.js';
import { TWEAK_FLAGS } from './flags/tweaks.js';
import { WORLD_FLAGS } from './flags/world.js';
import { UsageError } from './util.js';
const REPEATABLE_FLAGS = new Set(['S']);
export const PRESETS = [
    {
        title: 'Casual',
        descr: `Basic flags for a relatively easy playthrough.`,
        flags: 'Ds Edmrsx Fw Mr Rp Sc Sk Sm Tab',
    },
    {
        title: 'Intermediate',
        descr: `Slightly more challenge than Casual but still approachable.`,
        flags: 'Ds Edms Fsw Gt Mr Ps Rpt Sct Skm Tab',
        default: true,
    },
    {
        title: 'Full Shuffle',
        descr: `Slightly harder than intermediate, with full shuffle and no spoiler log.`,
        flags: 'Em Fsw Gt Mert Ps Rprt Sckmt Tabmp Wmtuw',
    },
    {
        title: 'Glitchless',
        descr: `Full shuffle but with no glitches.`,
        flags: 'Em Fcpstw Mert Ps Rprt Sckmt Tab Wmtuw',
    },
    {
        title: 'Advanced',
        descr: `A balanced randomization with quite a bit more difficulty.`,
        flags: 'Fsw Gfprt Hbdgw Mert Ps Roprst Sckt Sm Tabmp Wmtuw',
    },
    {
        title: 'Ludicrous',
        descr: `Pulls out all the stops, may require superhuman feats.`,
        flags: 'Fs Gcfprtw Hbdgmswxz Mert Ps Roprst Sckmt Tabmp Wmtuw',
    },
    {
        title: 'Mattrick',
        descr: 'Not for the faint of heart. Good luck...',
        flags: 'Fcprsw Gt Hbdhwx Mert Ps Ropst Sckmt Tabmp Wmtuw',
    },
    {
        title: 'Tournament: Swiss Round',
        descr: 'Quick-paced full-shuffle flags for Swiss Round of 2019 Tournament',
        flags: 'Es Fcprsw Gt Hd Mr Ps Rpt Sckmt Tab',
    },
];
const PRESETS_BY_KEY = {};
for (const { title, flags } of PRESETS) {
    PRESETS_BY_KEY[`@${title.replace(/ /g, '').toLowerCase()}`] = flags;
}
export const FLAGS = [
    ITEM_FLAGS, WORLD_FLAGS, MONSTER_FLAGS, SHOP_FLAGS, HARD_MODE_FLAGS,
    TWEAK_FLAGS, ROUTING_FLAGS, GLITCH_FLAGS, GLITCH_FIX_FLAGS, EASY_MODE_FLAGS,
    DEBUG_MODE_FLAGS
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
            const [, key, value] = match;
            const terms = REPEATABLE_FLAGS.has(key) ? [value] : value;
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
    zebuStudentGivesItem() {
        return !this.check('Re');
        ;
    }
    addEastCave() {
        return this.check('Re');
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
    assumeWildWarp() {
        return this.check('Gw');
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
        if (REPEATABLE_FLAGS.has(key)) {
            return [...this.flags[key]].sort().map(v => key + v).join(' ');
        }
        return key + [...this.flags[key]].sort().join('');
    }
    exclusiveFlags(flag) {
        if (flag.startsWith('S')) {
            return new RegExp(`S.*[${flag.substring(1)}]`);
        }
        const flagForName = this.getFlagForName(flag);
        if (flagForName == null)
            throw new Error(`Unknown flag: ${flag}`);
        return flagForName.conflict;
    }
    getFlagForName(flag) {
        const matchingFlagSection = FLAGS.find(flagSection => {
            return flag.startsWith(flagSection.prefix);
        });
        return matchingFlagSection
            .flags.find(flagToMatch => flagToMatch.flag === flag);
    }
    toString() {
        const keys = Object.keys(this.flags);
        keys.sort();
        return keys.map(k => this.toStringKey(k)).join(' ');
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmxhZ3NldC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9qcy9mbGFnc2V0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBQyxnQkFBZ0IsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ3ZELE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUVyRCxPQUFPLEVBQUMsZ0JBQWdCLEVBQUMsTUFBTSx5QkFBeUIsQ0FBQztBQUN6RCxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDakQsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQ3JELE9BQU8sRUFBQyxVQUFVLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUM1QyxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDbEQsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBQ2pELE9BQU8sRUFBQyxVQUFVLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUM1QyxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDOUMsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBQzdDLE9BQU8sRUFBQyxVQUFVLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFFckMsTUFBTSxnQkFBZ0IsR0FBZ0IsSUFBSSxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBRXJELE1BQU0sQ0FBQyxNQUFNLE9BQU8sR0FBYTtJQUMvQjtRQUNFLEtBQUssRUFBRSxRQUFRO1FBRWYsS0FBSyxFQUFFLGdEQUFnRDtRQUN2RCxLQUFLLEVBQUUsaUNBQWlDO0tBQ3pDO0lBQ0Q7UUFDRSxLQUFLLEVBQUUsY0FBYztRQUVyQixLQUFLLEVBQUUsNkRBQTZEO1FBQ3BFLEtBQUssRUFBRSxzQ0FBc0M7UUFFN0MsT0FBTyxFQUFFLElBQUk7S0FDZDtJQUNE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VSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUM3QyxDQUFDLENBQUMsQ0FBQztRQUVILE9BQTJCLG1CQUFvQjthQUMxQyxLQUFLLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUMsV0FBVyxDQUFDLElBQUksS0FBSyxJQUFJLENBQUMsQ0FBQztJQUM1RCxDQUFDO0lBRUQsUUFBUTtRQUNOLE1BQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3JDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNaLE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDdEQsQ0FBQztDQUNGIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtERUJVR19NT0RFX0ZMQUdTfSBmcm9tICcuL2ZsYWdzL2RlYnVnLW1vZGUuanMnO1xuaW1wb3J0IHtFQVNZX01PREVfRkxBR1N9IGZyb20gJy4vZmxhZ3MvZWFzeS1tb2RlLmpzJztcbmltcG9ydCB7RmxhZywgRmxhZ1NlY3Rpb24sIFByZXNldH0gZnJvbSAnLi9mbGFncy9mbGFnLmpzJztcbmltcG9ydCB7R0xJVENIX0ZJWF9GTEFHU30gZnJvbSAnLi9mbGFncy9nbGl0Y2gtZml4ZXMuanMnO1xuaW1wb3J0IHtHTElUQ0hfRkxBR1N9IGZyb20gJy4vZmxhZ3MvZ2xpdGNoZXMuanMnO1xuaW1wb3J0IHtIQVJEX01PREVfRkxBR1N9IGZyb20gJy4vZmxhZ3MvaGFyZC1tb2RlLmpzJztcbmltcG9ydCB7SVRFTV9GTEFHU30gZnJvbSAnLi9mbGFncy9pdGVtcy5qcyc7XG5pbXBvcnQge01PTlNURVJfRkxBR1N9IGZyb20gJy4vZmxhZ3MvbW9uc3RlcnMuanMnO1xuaW1wb3J0IHtST1VUSU5HX0ZMQUdTfSBmcm9tICcuL2ZsYWdzL3JvdXRpbmcuanMnO1xuaW1wb3J0IHtTSE9QX0ZMQUdTfSBmcm9tICcuL2ZsYWdzL3Nob3BzLmpzJztcbmltcG9ydCB7VFdFQUtfRkxBR1N9IGZyb20gJy4vZmxhZ3MvdHdlYWtzLmpzJztcbmltcG9ydCB7V09STERfRkxBR1N9IGZyb20gJy4vZmxhZ3Mvd29ybGQuanMnO1xuaW1wb3J0IHtVc2FnZUVycm9yfSBmcm9tICcuL3V0aWwuanMnO1xuXG5jb25zdCBSRVBFQVRBQkxFX0ZMQUdTOiBTZXQ8c3RyaW5nPiA9IG5ldyBTZXQoWydTJ10pO1xuXG5leHBvcnQgY29uc3QgUFJFU0VUUzogUHJlc2V0W10gPSBbXG4gIHtcbiAgICB0aXRsZTogJ0Nhc3VhbCcsXG5cbiAgICBkZXNjcjogYEJhc2ljIGZsYWdzIGZvciBhIHJlbGF0aXZlbHkgZWFzeSBwbGF5dGhyb3VnaC5gLFxuICAgIGZsYWdzOiAnRHMgRWRtcnN4IEZ3IE1yIFJwIFNjIFNrIFNtIFRhYicsXG4gIH0sXG4gIHtcbiAgICB0aXRsZTogJ0ludGVybWVkaWF0ZScsXG5cbiAgICBkZXNjcjogYFNsaWdodGx5IG1vcmUgY2hhbGxlbmdlIHRoYW4gQ2FzdWFsIGJ1dCBzdGlsbCBhcHByb2FjaGFibGUuYCxcbiAgICBmbGFnczogJ0RzIEVkbXMgRnN3IEd0IE1yIFBzIFJwdCBTY3QgU2ttIFRhYicsXG5cbiAgICBkZWZhdWx0OiB0cnVlLFxuICB9LFxuICB7XG4gICAgdGl0bGU6ICdGdWxsIFNodWZmbGUnLFxuXG4gICAgZGVzY3I6XG4gICAgICAgIGBTbGlnaHRseSBoYXJkZXIgdGhhbiBpbnRlcm1lZGlhdGUsIHdpdGggZnVsbCBzaHVmZmxlIGFuZCBubyBzcG9pbGVyIGxvZy5gLFxuICAgIGZsYWdzOiAnRW0gRnN3IEd0IE1lcnQgUHMgUnBydCBTY2ttdCBUYWJtcCBXbXR1dycsXG4gIH0sXG4gIHtcbiAgICB0aXRsZTogJ0dsaXRjaGxlc3MnLFxuXG4gICAgZGVzY3I6IGBGdWxsIHNodWZmbGUgYnV0IHdpdGggbm8gZ2xpdGNoZXMuYCxcbiAgICBmbGFnczogJ0VtIEZjcHN0dyBNZXJ0IFBzIFJwcnQgU2NrbXQgVGFiIFdtdHV3JyxcbiAgfSxcbiAge1xuICAgIC8vIFRPRE86IGFkZCAnSHQnIGZvciBtYXhpbmcgb3V0IHRvd2VyIHNjYWxpbmdcbiAgICB0aXRsZTogJ0FkdmFuY2VkJyxcblxuICAgIGRlc2NyOiBgQSBiYWxhbmNlZCByYW5kb21pemF0aW9uIHdpdGggcXVpdGUgYSBiaXQgbW9yZSBkaWZmaWN1bHR5LmAsXG4gICAgZmxhZ3M6ICdGc3cgR2ZwcnQgSGJkZ3cgTWVydCBQcyBSb3Byc3QgU2NrdCBTbSBUYWJtcCBXbXR1dycsXG4gIH0sXG4gIHtcbiAgICAvLyBUT0RPOiBhZGQgJ0h0J1xuICAgIHRpdGxlOiAnTHVkaWNyb3VzJyxcblxuICAgIGRlc2NyOiBgUHVsbHMgb3V0IGFsbCB0aGUgc3RvcHMsIG1heSByZXF1aXJlIHN1cGVyaHVtYW4gZmVhdHMuYCxcbiAgICBmbGFnczogJ0ZzIEdjZnBydHcgSGJkZ21zd3h6IE1lcnQgUHMgUm9wcnN0IFNja210IFRhYm1wIFdtdHV3JyxcbiAgfSxcbiAge1xuICAgIHRpdGxlOiAnTWF0dHJpY2snLFxuXG4gICAgZGVzY3I6ICdOb3QgZm9yIHRoZSBmYWludCBvZiBoZWFydC4gR29vZCBsdWNrLi4uJyxcbiAgICBmbGFnczogJ0ZjcHJzdyBHdCBIYmRod3ggTWVydCBQcyBSb3BzdCBTY2ttdCBUYWJtcCBXbXR1dycsXG4gIH0sXG4gIC8vIFRPVVJOQU1FTlQgUFJFU0VUU1xuICB7XG4gICAgdGl0bGU6ICdUb3VybmFtZW50OiBTd2lzcyBSb3VuZCcsXG5cbiAgICBkZXNjcjogJ1F1aWNrLXBhY2VkIGZ1bGwtc2h1ZmZsZSBmbGFncyBmb3IgU3dpc3MgUm91bmQgb2YgMjAxOSBUb3VybmFtZW50JyxcbiAgICBmbGFnczogJ0VzIEZjcHJzdyBHdCBIZCBNciBQcyBScHQgU2NrbXQgVGFiJyxcbiAgfSxcbl07XG5cbi8vIEp1c3QgdGhlIGZsYWdzLCBub3QgdGhlIHdob2xlIGRvY3VtZW50YXRpb24uXG5jb25zdCBQUkVTRVRTX0JZX0tFWToge1trZXk6IHN0cmluZ106IHN0cmluZ30gPSB7fTtcbmZvciAoY29uc3Qge3RpdGxlLCBmbGFnc30gb2YgUFJFU0VUUykge1xuICBQUkVTRVRTX0JZX0tFWVtgQCR7dGl0bGUucmVwbGFjZSgvIC9nLCAnJykudG9Mb3dlckNhc2UoKX1gXSA9IGZsYWdzO1xufVxuXG5leHBvcnQgY29uc3QgRkxBR1M6IEZsYWdTZWN0aW9uW10gPSBbXG4gIElURU1fRkxBR1MsIFdPUkxEX0ZMQUdTLCBNT05TVEVSX0ZMQUdTLCBTSE9QX0ZMQUdTLCBIQVJEX01PREVfRkxBR1MsXG4gIFRXRUFLX0ZMQUdTLCBST1VUSU5HX0ZMQUdTLCBHTElUQ0hfRkxBR1MsIEdMSVRDSF9GSVhfRkxBR1MsIEVBU1lfTU9ERV9GTEFHUyxcbiAgREVCVUdfTU9ERV9GTEFHU1xuXTtcblxuZXhwb3J0IGNsYXNzIEZsYWdTZXQge1xuICBwcml2YXRlIGZsYWdzOiB7W3NlY3Rpb246IHN0cmluZ106IHN0cmluZ1tdfTtcblxuICBjb25zdHJ1Y3RvcihzdHIgPSAnUnRHZnRUYWInKSB7XG4gICAgaWYgKHN0ci5zdGFydHNXaXRoKCdAJykpIHtcbiAgICAgIGNvbnN0IGV4cGFuZGVkID0gUFJFU0VUU19CWV9LRVlbc3RyLnRvTG93ZXJDYXNlKCldO1xuICAgICAgaWYgKCFleHBhbmRlZCkgdGhyb3cgbmV3IFVzYWdlRXJyb3IoYFVua25vd24gcHJlc2V0OiAke3N0cn1gKTtcbiAgICAgIHN0ciA9IGV4cGFuZGVkO1xuICAgIH1cbiAgICB0aGlzLmZsYWdzID0ge307XG4gICAgLy8gcGFyc2UgdGhlIHN0cmluZ1xuICAgIHN0ciA9IHN0ci5yZXBsYWNlKC9bXkEtWmEtejAtOSFdL2csICcnKTtcbiAgICBjb25zdCByZSA9IC8oW0EtWl0pKFthLXowLTkhXSspL2c7XG4gICAgbGV0IG1hdGNoO1xuICAgIHdoaWxlICgobWF0Y2ggPSByZS5leGVjKHN0cikpKSB7XG4gICAgICBjb25zdCBbLCBrZXksIHZhbHVlXSA9IG1hdGNoO1xuICAgICAgY29uc3QgdGVybXMgPSBSRVBFQVRBQkxFX0ZMQUdTLmhhcyhrZXkpID8gW3ZhbHVlXSA6IHZhbHVlO1xuICAgICAgZm9yIChjb25zdCB0ZXJtIG9mIHRlcm1zKSB7XG4gICAgICAgIHRoaXMuc2V0KGtleSArIHRlcm0sIHRydWUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGdldChjYXRlZ29yeTogc3RyaW5nKTogc3RyaW5nW10ge1xuICAgIHJldHVybiB0aGlzLmZsYWdzW2NhdGVnb3J5XSB8fCBbXTtcbiAgfVxuXG4gIHNldChmbGFnOiBzdHJpbmcsIHZhbHVlOiBib29sZWFuKSB7XG4gICAgLy8gY2hlY2sgZm9yIGluY29tcGF0aWJsZSBmbGFncy4uLj9cbiAgICBjb25zdCBrZXkgPSBmbGFnWzBdO1xuICAgIGNvbnN0IHRlcm0gPSBmbGFnLnN1YnN0cmluZygxKTsgIC8vIGFzc2VydDogdGVybSBpcyBvbmx5IGxldHRlcnMvbnVtYmVyc1xuICAgIGlmICghdmFsdWUpIHtcbiAgICAgIC8vIEp1c3QgZGVsZXRlIC0gdGhhdCdzIGVhc3kuXG4gICAgICBjb25zdCBmaWx0ZXJlZCA9ICh0aGlzLmZsYWdzW2tleV0gfHwgW10pLmZpbHRlcih0ID0+IHQgIT09IHRlcm0pO1xuICAgICAgaWYgKGZpbHRlcmVkLmxlbmd0aCkge1xuICAgICAgICB0aGlzLmZsYWdzW2tleV0gPSBmaWx0ZXJlZDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGRlbGV0ZSB0aGlzLmZsYWdzW2tleV07XG4gICAgICB9XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIC8vIEFjdHVhbGx5IGFkZCB0aGUgZmxhZy5cbiAgICB0aGlzLnJlbW92ZUNvbmZsaWN0cyhmbGFnKTtcbiAgICBjb25zdCB0ZXJtcyA9ICh0aGlzLmZsYWdzW2tleV0gfHwgW10pLmZpbHRlcih0ID0+IHQgIT09IHRlcm0pO1xuICAgIHRlcm1zLnB1c2godGVybSk7XG4gICAgdGVybXMuc29ydCgpO1xuICAgIHRoaXMuZmxhZ3Nba2V5XSA9IHRlcm1zO1xuICB9XG5cbiAgY2hlY2soZmxhZzogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgY29uc3QgdGVybXMgPSB0aGlzLmZsYWdzW2ZsYWdbMF1dO1xuICAgIHJldHVybiAhISh0ZXJtcyAmJiAodGVybXMuaW5kZXhPZihmbGFnLnN1YnN0cmluZygxKSkgPj0gMCkpO1xuICB9XG5cbiAgYXV0b0VxdWlwQnJhY2VsZXQoKSB7XG4gICAgcmV0dXJuIHRoaXMuY2hlY2soJ1RhJyk7XG4gIH1cbiAgYnVmZkRlb3NQZW5kYW50KCkge1xuICAgIHJldHVybiB0aGlzLmNoZWNrKCdUYicpO1xuICB9XG4gIGNoYW5nZUdhc01hc2tUb0hhem1hdFN1aXQoKSB7XG4gICAgcmV0dXJuIHRoaXMuY2hlY2soJ1RiJyk7XG4gIH1cbiAgc2xvd0Rvd25Ub3JuYWRvKCkge1xuICAgIHJldHVybiB0aGlzLmNoZWNrKCdUYicpO1xuICB9XG4gIGxlYXRoZXJCb290c0dpdmVTcGVlZCgpIHtcbiAgICByZXR1cm4gdGhpcy5jaGVjaygnVGInKTtcbiAgfVxuICByYWJiaXRCb290c0NoYXJnZVdoaWxlV2Fsa2luZygpIHtcbiAgICByZXR1cm4gdGhpcy5jaGVjaygnVGInKTtcbiAgfVxuICBjb250cm9sbGVyU2hvcnRjdXRzKCkge1xuICAgIHJldHVybiAhdGhpcy5jaGVjaygnVGMnKTtcbiAgfVxuICByYW5kb21pemVNdXNpYygpIHtcbiAgICByZXR1cm4gdGhpcy5jaGVjaygnVG0nKTtcbiAgfVxuICBzaHVmZmxlU3ByaXRlUGFsZXR0ZXMoKSB7XG4gICAgcmV0dXJuIHRoaXMuY2hlY2soJ1RwJyk7XG4gIH1cblxuICBzaHVmZmxlTW9uc3RlcnMoKSB7XG4gICAgcmV0dXJuIHRoaXMuY2hlY2soJ01yJyk7XG4gIH1cbiAgc2h1ZmZsZVNob3BzKCkge1xuICAgIHJldHVybiB0aGlzLmNoZWNrKCdQcycpO1xuICB9XG4gIGJhcmdhaW5IdW50aW5nKCkge1xuICAgIHJldHVybiB0aGlzLnNodWZmbGVTaG9wcygpO1xuICB9XG5cbiAgc2h1ZmZsZVRvd2VyTW9uc3RlcnMoKSB7XG4gICAgcmV0dXJuIHRoaXMuY2hlY2soJ010Jyk7XG4gIH1cbiAgc2h1ZmZsZU1vbnN0ZXJFbGVtZW50cygpIHtcbiAgICByZXR1cm4gdGhpcy5jaGVjaygnTWUnKTtcbiAgfVxuICBzaHVmZmxlQm9zc0VsZW1lbnRzKCkge1xuICAgIHJldHVybiB0aGlzLnNodWZmbGVNb25zdGVyRWxlbWVudHMoKTtcbiAgfVxuXG4gIGRvdWJsZUJ1ZmZNZWRpY2FsSGVyYigpIHtcbiAgICByZXR1cm4gdGhpcy5jaGVjaygnRW0nKTtcbiAgfVxuICBidWZmTWVkaWNhbEhlcmIoKSB7XG4gICAgcmV0dXJuICF0aGlzLmNoZWNrKCdIbScpO1xuICB9XG4gIGRlY3JlYXNlRW5lbXlEYW1hZ2UoKSB7XG4gICAgcmV0dXJuIHRoaXMuY2hlY2soJ0VkJyk7XG4gIH1cbiAgdHJhaW5lcigpIHtcbiAgICByZXR1cm4gdGhpcy5jaGVjaygnRHQnKTtcbiAgfVxuICBuZXZlckRpZSgpIHtcbiAgICByZXR1cm4gdGhpcy5jaGVjaygnRGknKTtcbiAgfVxuICBjaGFyZ2VTaG90c09ubHkoKSB7XG4gICAgcmV0dXJuIHRoaXMuY2hlY2soJ0hjJyk7XG4gIH1cblxuICBiYXJyaWVyUmVxdWlyZXNDYWxtU2VhKCkge1xuICAgIHJldHVybiB0cnVlOyAvLyB0aGlzLmNoZWNrKCdSbCcpO1xuICB9XG4gIHBhcmFseXNpc1JlcXVpcmVzUHJpc29uS2V5KCkge1xuICAgIHJldHVybiB0cnVlOyAvLyB0aGlzLmNoZWNrKCdSbCcpO1xuICB9XG4gIHNlYWxlZENhdmVSZXF1aXJlc1dpbmRtaWxsKCkge1xuICAgIHJldHVybiB0cnVlOyAvLyB0aGlzLmNoZWNrKCdSbCcpO1xuICB9XG4gIGNvbm5lY3RMaW1lVHJlZVRvTGVhZigpIHtcbiAgICByZXR1cm4gdGhpcy5jaGVjaygnUnAnKTtcbiAgfVxuICB6ZWJ1U3R1ZGVudEdpdmVzSXRlbSgpIHtcbiAgICByZXR1cm4gIXRoaXMuY2hlY2soJ1JlJyk7O1xuICB9XG4gIGFkZEVhc3RDYXZlKCkge1xuICAgIHJldHVybiB0aGlzLmNoZWNrKCdSZScpO1xuICB9XG4gIHN0b3J5TW9kZSgpIHtcbiAgICByZXR1cm4gdGhpcy5jaGVjaygnUnMnKTtcbiAgfVxuICByZXF1aXJlSGVhbGVkRG9scGhpblRvUmlkZSgpIHtcbiAgICByZXR1cm4gdGhpcy5jaGVjaygnUmQnKTtcbiAgfVxuICBzYWhhcmFSYWJiaXRzUmVxdWlyZVRlbGVwYXRoeSgpIHtcbiAgICByZXR1cm4gdGhpcy5jaGVjaygnUnInKTtcbiAgfVxuICB0ZWxlcG9ydE9uVGh1bmRlclN3b3JkKCkge1xuICAgIHJldHVybiB0aGlzLmNoZWNrKCdSdCcpO1xuICB9XG4gIG9yYnNPcHRpb25hbCgpIHtcbiAgICByZXR1cm4gdGhpcy5jaGVjaygnUm8nKTtcbiAgfVxuXG4gIHJhbmRvbWl6ZU1hcHMoKSB7XG4gICAgcmV0dXJuIHRoaXMuY2hlY2soJ1dtJyk7XG4gIH1cbiAgcmFuZG9taXplVHJhZGVzKCkge1xuICAgIHJldHVybiB0aGlzLmNoZWNrKCdXdCcpO1xuICB9XG4gIHVuaWRlbnRpZmllZEl0ZW1zKCkge1xuICAgIHJldHVybiB0aGlzLmNoZWNrKCdXdScpO1xuICB9XG4gIHJhbmRvbWl6ZVdhbGxzKCkge1xuICAgIHJldHVybiB0aGlzLmNoZWNrKCdXdycpO1xuICB9XG5cbiAgZ3VhcmFudGVlU3dvcmQoKSB7XG4gICAgcmV0dXJuIHRoaXMuY2hlY2soJ0VzJyk7XG4gIH1cbiAgZ3VhcmFudGVlU3dvcmRNYWdpYygpIHtcbiAgICByZXR1cm4gIXRoaXMuY2hlY2soJ0h3Jyk7XG4gIH1cbiAgZ3VhcmFudGVlTWF0Y2hpbmdTd29yZCgpIHtcbiAgICByZXR1cm4gIXRoaXMuY2hlY2soJ0hzJyk7XG4gIH1cbiAgZ3VhcmFudGVlR2FzTWFzaygpIHtcbiAgICByZXR1cm4gIXRoaXMuY2hlY2soJ0hnJyk7XG4gIH1cbiAgZ3VhcmFudGVlQmFycmllcigpIHtcbiAgICByZXR1cm4gIXRoaXMuY2hlY2soJ0hiJyk7XG4gIH1cbiAgZ3VhcmFudGVlUmVmcmVzaCgpIHtcbiAgICByZXR1cm4gdGhpcy5jaGVjaygnRXInKTtcbiAgfVxuXG4gIGRpc2FibGVTd29yZENoYXJnZUdsaXRjaCgpIHtcbiAgICByZXR1cm4gdGhpcy5jaGVjaygnRmMnKTtcbiAgfVxuICBkaXNhYmxlVGVsZXBvcnRTa2lwKCkge1xuICAgIHJldHVybiB0aGlzLmNoZWNrKCdGcCcpO1xuICB9XG4gIGRpc2FibGVSYWJiaXRTa2lwKCkge1xuICAgIHJldHVybiB0aGlzLmNoZWNrKCdGcicpO1xuICB9XG4gIGRpc2FibGVTaG9wR2xpdGNoKCkge1xuICAgIHJldHVybiB0aGlzLmNoZWNrKCdGcycpO1xuICB9XG4gIGRpc2FibGVTdGF0dWVHbGl0Y2goKSB7XG4gICAgcmV0dXJuIHRoaXMuY2hlY2soJ0Z0Jyk7XG4gIH1cblxuICBhc3N1bWVTd29yZENoYXJnZUdsaXRjaCgpIHtcbiAgICByZXR1cm4gdGhpcy5jaGVjaygnR2MnKTtcbiAgfVxuICBhc3N1bWVHaGV0dG9GbGlnaHQoKSB7XG4gICAgcmV0dXJuIHRoaXMuY2hlY2soJ0dmJyk7XG4gIH1cbiAgYXNzdW1lVGVsZXBvcnRTa2lwKCkge1xuICAgIHJldHVybiB0aGlzLmNoZWNrKCdHcCcpO1xuICB9XG4gIGFzc3VtZVJhYmJpdFNraXAoKSB7XG4gICAgcmV0dXJuIHRoaXMuY2hlY2soJ0dyJyk7XG4gIH1cbiAgYXNzdW1lU3RhdHVlR2xpdGNoKCkge1xuICAgIHJldHVybiB0aGlzLmNoZWNrKCdHdCcpO1xuICB9XG4gIGFzc3VtZVRyaWdnZXJHbGl0Y2goKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9ICAvLyBUT0RPIC0gb25seSB3b3JrcyBvbiBsYW5kP1xuICBhc3N1bWVXaWxkV2FycCgpIHtcbiAgICByZXR1cm4gdGhpcy5jaGVjaygnR3cnKTtcbiAgfVxuXG4gIG5lcmZXaWxkV2FycCgpIHtcbiAgICByZXR1cm4gdGhpcy5jaGVjaygnRncnKTtcbiAgfVxuICBhbGxvd1dpbGRXYXJwKCkge1xuICAgIHJldHVybiAhdGhpcy5uZXJmV2lsZFdhcnAoKTtcbiAgfVxuICByYW5kb21pemVXaWxkV2FycCgpIHtcbiAgICByZXR1cm4gdGhpcy5jaGVjaygnVHcnKTtcbiAgfVxuXG4gIGJsYWNrb3V0TW9kZSgpIHtcbiAgICByZXR1cm4gdGhpcy5jaGVjaygnSHonKTtcbiAgfVxuICBoYXJkY29yZU1vZGUoKSB7XG4gICAgcmV0dXJuIHRoaXMuY2hlY2soJ0hoJyk7XG4gIH1cbiAgYnVmZkR5bmEoKSB7XG4gICAgcmV0dXJuIHRoaXMuY2hlY2soJ0hkJyk7XG4gIH1cblxuICBleHBTY2FsaW5nRmFjdG9yKCkge1xuICAgIHJldHVybiB0aGlzLmNoZWNrKCdIeCcpID8gMC4yNSA6IHRoaXMuY2hlY2soJ0V4JykgPyAyLjUgOiAxO1xuICB9XG5cbiAgLy8gVGhlIGZvbGxvd2luZyBkaWRuJ3QgZW5kIHVwIGdldHRpbmcgdXNlZC5cblxuICAvLyBhbGxvd3MoZmxhZykge1xuICAvLyAgIGNvbnN0IHJlID0gZXhjbHVzaXZlRmxhZ3MoZmxhZyk7XG4gIC8vICAgaWYgKCFyZSkgcmV0dXJuIHRydWU7XG4gIC8vICAgZm9yIChjb25zdCBrZXkgaW4gdGhpcy5mbGFncykge1xuICAvLyAgICAgaWYgKHRoaXMuZmxhZ3Nba2V5XS5maW5kKHQgPT4gcmUudGVzdChrZXkgKyB0KSkpIHJldHVybiBmYWxzZTtcbiAgLy8gICB9XG4gIC8vICAgcmV0dXJuIHRydWU7XG4gIC8vIH1cblxuICAvLyBtZXJnZSh0aGF0KSB7XG4gIC8vICAgdGhpcy5mbGFncyA9IHRoYXQuZmxhZ3M7XG4gIC8vIH1cblxuICBwcml2YXRlIHJlbW92ZUNvbmZsaWN0cyhmbGFnOiBzdHJpbmcpIHtcbiAgICAvLyBOT1RFOiB0aGlzIGlzIHNvbWV3aGF0IHJlZHVuZGFudCB3aXRoIHNldChmbGFnLCBmYWxzZSlcbiAgICBjb25zdCByZSA9IHRoaXMuZXhjbHVzaXZlRmxhZ3MoZmxhZyk7XG4gICAgaWYgKCFyZSkgcmV0dXJuO1xuICAgIGZvciAoY29uc3Qga2V5IGluIHRoaXMuZmxhZ3MpIHtcbiAgICAgIGlmICghdGhpcy5mbGFncy5oYXNPd25Qcm9wZXJ0eShrZXkpKSBjb250aW51ZTtcbiAgICAgIGNvbnN0IHRlcm1zID0gdGhpcy5mbGFnc1trZXldLmZpbHRlcih0ID0+ICFyZS50ZXN0KGtleSArIHQpKTtcbiAgICAgIGlmICh0ZXJtcy5sZW5ndGgpIHtcbiAgICAgICAgdGhpcy5mbGFnc1trZXldID0gdGVybXM7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBkZWxldGUgdGhpcy5mbGFnc1trZXldO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgdG9TdHJpbmdLZXkoa2V5OiBzdHJpbmcpIHtcbiAgICBpZiAoUkVQRUFUQUJMRV9GTEFHUy5oYXMoa2V5KSkge1xuICAgICAgcmV0dXJuIFsuLi50aGlzLmZsYWdzW2tleV1dLnNvcnQoKS5tYXAodiA9PiBrZXkgKyB2KS5qb2luKCcgJyk7XG4gICAgfVxuICAgIHJldHVybiBrZXkgKyBbLi4udGhpcy5mbGFnc1trZXldXS5zb3J0KCkuam9pbignJyk7XG4gIH1cblxuICBwcml2YXRlIGV4Y2x1c2l2ZUZsYWdzKGZsYWc6IHN0cmluZyk6IFJlZ0V4cHx1bmRlZmluZWQge1xuICAgIGlmIChmbGFnLnN0YXJ0c1dpdGgoJ1MnKSkge1xuICAgICAgcmV0dXJuIG5ldyBSZWdFeHAoYFMuKlske2ZsYWcuc3Vic3RyaW5nKDEpfV1gKTtcbiAgICB9XG5cbiAgICBjb25zdCBmbGFnRm9yTmFtZTogRmxhZyA9IHRoaXMuZ2V0RmxhZ0Zvck5hbWUoZmxhZyk7XG4gICAgaWYgKGZsYWdGb3JOYW1lID09IG51bGwpIHRocm93IG5ldyBFcnJvcihgVW5rbm93biBmbGFnOiAke2ZsYWd9YCk7XG4gICAgcmV0dXJuIGZsYWdGb3JOYW1lLmNvbmZsaWN0O1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRGbGFnRm9yTmFtZShmbGFnOiBzdHJpbmcpOiBGbGFnIHtcbiAgICBjb25zdCBtYXRjaGluZ0ZsYWdTZWN0aW9uID0gRkxBR1MuZmluZChmbGFnU2VjdGlvbiA9PiB7XG4gICAgICByZXR1cm4gZmxhZy5zdGFydHNXaXRoKGZsYWdTZWN0aW9uLnByZWZpeCk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gPEZsYWc+KDxGbGFnU2VjdGlvbj5tYXRjaGluZ0ZsYWdTZWN0aW9uKVxuICAgICAgICAuZmxhZ3MuZmluZChmbGFnVG9NYXRjaCA9PiBmbGFnVG9NYXRjaC5mbGFnID09PSBmbGFnKTtcbiAgfVxuXG4gIHRvU3RyaW5nKCkge1xuICAgIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyh0aGlzLmZsYWdzKTtcbiAgICBrZXlzLnNvcnQoKTtcbiAgICByZXR1cm4ga2V5cy5tYXAoayA9PiB0aGlzLnRvU3RyaW5nS2V5KGspKS5qb2luKCcgJyk7XG4gIH1cbn1cbiJdfQ==