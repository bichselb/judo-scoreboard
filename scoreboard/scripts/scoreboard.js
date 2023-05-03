
// Judo Scoreboard for use at judo tournaments.
// Copyright (C) 2023 Benjamin Bichsel

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.

// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

//////////////
// PREFETCH //
//////////////
// needs to be early, otherwise it is undefined in critical places
var master_timer_ms = 10;

/////////////////
// FIGHT RULES //
/////////////////

var fight_rules = {
    // fight time
    total_fight_time: 5 * 60 * 1000,
    // osaekomi times
    osaekomi_warn_unassigned: 2 * 1000,
    osaekomi_wazari_time: 10 * 1000,
    osaekomi_ippon_time: 20 * 1000,
    osaekomi_max_time: 20 * 1000,
    // stopping clock
    stop_clock_on_ippon: 1,
    stop_clock_on_wazari: 2,
    stop_clock_on_shido: 3,
    stop_osaekomi_on_ippon: 1,
    stop_osaekomi_on_wazari: 2,
    count_wazaris_towards_ippon: 2,
    // sound
    osaekomi_error_sound_frequency_ms: 1000,
    error_sound_volume: 1,
    win_sound_volume: 1,
    // keys
    enable_reset_by_enter: true
}

/////////////////
// FIGHT STATE //
/////////////////

function get_initial_fight_state() {
    console.assert(fight_rules.total_fight_time % master_timer_ms == 0, "Total fight time invalid");
    if (fight_rules.osaekomi_warn_unassigned != null) {
        console.assert(fight_rules.osaekomi_warn_unassigned % master_timer_ms == 0, "Osaekomi warn time invalid");
    }
    if (fight_rules.osaekomi_wazari_time != null) {
        console.assert(fight_rules.osaekomi_wazari_time % master_timer_ms == 0, "Osaekomi wazari time invalid");
    }
    if (fight_rules.osaekomi_ippon_time != null) {
        console.assert(fight_rules.osaekomi_ippon_time % master_timer_ms == 0, "Osaekomi ippon time invalid");
    }
    if (fight_rules.osaekomi_max_time != null) {
        console.assert(fight_rules.osaekomi_max_time % master_timer_ms == 0, "Osaekomi max time invalid");
    }


    points = {
            0: {
                'ippon': 0,
                'wazari': 0,
                'shido': 0
            },
            1: {
                'ippon': 0,
                'wazari': 0,
                'shido': 0
            }
    };
    state = {
        // clock
        central_clock_running: false,
        central_clock_ms: fight_rules.total_fight_time,
        // points
        points: JSON.parse(JSON.stringify(points)),
        // osaekomi
        osaekomi_ms: 0,
        osaekomi_running: false,
        osaekomi_holder: -1,
        // golden score
        is_golden_score: false,
    };
    return state;
}
var fight_state = get_initial_fight_state();

/////////////////
// FIGHT LOGIC //
/////////////////

/**
 * Performs all necessary updates after a single time step
 */
function master_timer_tick() {
    if (fight_state.central_clock_running) {
        fight_state.central_clock_ms -= master_timer_ms;
    
        if (fight_state.is_golden_score) {

        } else {
            if (fight_state.central_clock_ms <= 0 && !fight_state.osaekomi_running) {
                fight_state.central_clock_running = false;
                ring_bell();
            }
            if (fight_state.central_clock_ms < 0) {
                fight_state.central_clock_ms = 0;
            }
        }
    }
    if (fight_state.osaekomi_running) {
        fight_state.osaekomi_ms += master_timer_ms;

        if (fight_state.osaekomi_holder != -1) {
            if (
                fight_rules.osaekomi_wazari_time != null &&
                fight_state.osaekomi_ms == fight_rules.osaekomi_wazari_time
            ) {
                add_point(fight_state.osaekomi_holder, 'wazari');
            }

            if (
                fight_rules.osaekomi_ippon_time != null &&
                fight_state.osaekomi_ms == fight_rules.osaekomi_ippon_time
            ) {
                remove_point(fight_state.osaekomi_holder, 'wazari');
                add_point(fight_state.osaekomi_holder, 'ippon');
            }
        }

        if (
            fight_rules.osaekomi_max_time != null &&
            fight_state.osaekomi_ms == fight_rules.osaekomi_max_time
        ) {
            fight_state.osaekomi_running = false
        }

        if (
            fight_rules.osaekomi_max_time != null &&
            fight_state.osaekomi_ms > fight_rules.osaekomi_max_time
        ) {
            fight_state.osaekomi_ms = fight_rules.osaekomi_max_time;
        }
    }
}

/**
 * Adds point and stops if winner
 */
function add_point(fighter, point_name) {
    const n_ippons_before = get_n_ippons(fighter);
    const n_wazaris_before = fight_state.points[fighter]['wazari'];
    const n_shidos_before = fight_state.points[fighter]['shido'];

    fight_state.points[fighter][point_name] += 1;

    // ippon stop?
    const n_ippons = get_n_ippons(fighter);
    const ippon_stop = 
        n_ippons_before != n_ippons &&
        fight_rules.stop_clock_on_ippon != null &&
        n_ippons % fight_rules.stop_clock_on_ippon == 0;

    // wazari stop?
    const n_wazaris = fight_state.points[fighter]['wazari'];
    const wazari_stop =
        n_wazaris_before != n_wazaris &&
        fight_rules.stop_clock_on_wazari != null &&
        n_wazaris % fight_rules.stop_clock_on_wazari == 0;
    
    // shido stop?
    const n_shidos = fight_state.points[fighter]['shido'];
    const shido_stop =
        n_shidos_before != n_shidos &&
        fight_rules.stop_clock_on_shido != null &&
        n_shidos % fight_rules.stop_clock_on_shido == 0;

    if (ippon_stop || wazari_stop || shido_stop) {
        ring_bell();
        matte();
    }

    // ippon osaekomi stop?
    const ippon_osaekomi_stop = 
        n_ippons_before != n_ippons &&
        fight_rules.stop_osaekomi_on_ippon != null &&
        n_ippons % fight_rules.stop_osaekomi_on_ippon == 0;
    
    // wazari osaekomi stop?
    const wazari_osaekomi_stop =
        n_wazaris_before != n_wazaris &&
        fight_rules.stop_osaekomi_on_wazari != null &&
        n_wazaris % fight_rules.stop_osaekomi_on_wazari == 0;
    
    if (ippon_osaekomi_stop || wazari_osaekomi_stop) {
        ring_bell();
        fight_state.osaekomi_running = false;
    }

}
function get_n_ippons(fighter) {
    var n_ippons = fight_state.points[fighter]['ippon'];
    if (fight_rules.count_wazaris_towards_ippon != null) {
        n_ippons += Math.floor(fight_state.points[fighter]['wazari'] / fight_rules.count_wazaris_towards_ippon);
    }
    return n_ippons;
}

function remove_point(fighter, point_name) {
    var current = fight_state.points[fighter][point_name];
    current = Math.max(current - 1, 0);
    fight_state.points[fighter][point_name] = current;
}

function hajime() {
    fight_state.central_clock_running = true;
}
function matte() {
    fight_state.central_clock_running = false;
    fight_state.osaekomi_running = false;
}
function reset_all() {
    fight_state = get_initial_fight_state();
}
function osaekomi() {
    fight_state.central_clock_running = true;
    fight_state.osaekomi_running = true;
}

/**
 * Assigns osaekomi
 * - Starts if osaekomi is not yet running
 * - Removes from previous holder (if they were set)
 * - Awards points if there are any to assign
 * 
 */
function osaekomi_assign(fighter, start_on_zero=true) {
    if (fight_state.osaekomi_ms == 0 && start_on_zero) {
        osaekomi();
    }

    if (fight_state.osaekomi_holder != -1) {
        // remove previously assigned points
        if (
            fight_rules.osaekomi_ippon_time != null &&
            fight_state.osaekomi_ms >= fight_rules.osaekomi_ippon_time
        ) {
            remove_point(fight_state.osaekomi_holder, 'ippon');
        } else if (
            fight_rules.osaekomi_wazari_time != null &&
            fight_state.osaekomi_ms >= fight_rules.osaekomi_wazari_time
        ) {
            remove_point(fight_state.osaekomi_holder, 'wazari');
        }
    }

    fight_state.osaekomi_holder = fighter;

    if (fighter != -1) {
        if (
            fight_rules.osaekomi_ippon_time != null &&
            fight_state.osaekomi_ms >= fight_rules.osaekomi_ippon_time
        ) {
            add_point(fight_state.osaekomi_holder, 'ippon');
        } else if (
            fight_rules.osaekomi_wazari_time != null &&
            fight_state.osaekomi_ms >= fight_rules.osaekomi_wazari_time
        ) {
            add_point(fight_state.osaekomi_holder, 'wazari');
        }
    }
}
function osaekomi_pause() {
    fight_state.osaekomi_running = false;
}
function osaekomi_continue() {
    hajime();
    osaekomi();
}
function osaekomi_reset() {
    fight_state.osaekomi_running = false;
    fight_state.osaekomi_holder = -1;
    fight_state.osaekomi_ms = 0;
}

/////////////
// DISPLAY //
/////////////

var div_point_ids_warned_about = new Set();
var osaekomi_assign_original_width = document.getElementById('osaekomi_assign_0').style.width;
var osaekomi_assign_text_original_width = document.getElementById('osaekomi_assign_text').style.width;


/**
 * 
 * @param {*} element The element with the tooltip
 * @param {*} text the new text to put
 */
function update_tooltip(element, text) {
    var tooltip = bootstrap.Tooltip.getInstance(element);
    if (tooltip._config.title != text) {
        tooltip._config.title = text;
        if (tooltip.tip) {
            tooltip.show();
        }
    }
}

/**
 * Update all aspects of the fight based on fight_state
 */
function update_display(){
    // total fight time reset button
    var reset = document.getElementById("total_fight_time_reset_time");
    reset.innerHTML = format_time_minutes(fight_rules.total_fight_time);

    // golden score
    div = document.getElementById('overtime');
    if (fight_state.is_golden_score) {
        div.style.display = null;
    } else {
        div.style.display = 'none';
    }

    // central clock
    div = document.getElementById('central_clock_time');
    div.innerHTML = format_time_minutes(fight_state.central_clock_ms);
    div = document.getElementById('central_clock_time_tenths');
    div.innerHTML = format_time_tenths(fight_state.central_clock_ms);

    // central clock buttons
    var pause_continue = document.getElementById('central_clock_pause_continue');
    var pause_continue_img = document.getElementById('central_clock_pause_continue_img');
    pause_continue_img.classList.remove('fa-play');
    pause_continue_img.classList.remove('fa-pause');
    if (fight_state.central_clock_running) {
        update_tooltip(pause_continue, 'Matte (Space)');
        pause_continue_img.classList.add('fa-pause');
    } else {
        update_tooltip(pause_continue, 'Hajime (Space)');
        pause_continue_img.classList.add('fa-play');
    }

    // osaekomi time
    div = document.getElementById('osaekomi_time');
    div.innerHTML = format_time_seconds(fight_state.osaekomi_ms);
    div = document.getElementById('osaekomi_time_tenths');
    div.innerHTML = format_time_tenths(fight_state.osaekomi_ms);

    // reset osaekomi assign
    div_0 = document.getElementById('osaekomi_assign_0');
    div_1 = document.getElementById('osaekomi_assign_1');
    div_text = document.getElementById('osaekomi_assign_text');
    
    // set osaekomi assign correctly
    div_0.style.width = osaekomi_assign_original_width;
    div_1.style.width = osaekomi_assign_original_width;
    div_text.style.display = null;
    if (fight_state.osaekomi_holder == 0) {
        div_0.style.width = '45%';
        div_1.style.width = '15%';
        div_text.style.display = 'none';
    } else if (fight_state.osaekomi_holder == 1) {
        div_0.style.width = '15%';
        div_1.style.width = '45%';
        div_text.style.display = 'none';
    }

    // highlight if forgotten
    div = document.getElementById('osaekomi_assign_text');
    div.classList.remove('osaekomi_assign_stress');
    if (
        fight_rules.osaekomi_warn_unassigned != null &&
        fight_state.osaekomi_holder == -1 &&
        fight_state.osaekomi_ms > fight_rules.osaekomi_warn_unassigned
    ) {
        div.classList.add('osaekomi_assign_stress');
        if (fight_state.osaekomi_running && fight_state.osaekomi_ms % fight_rules.osaekomi_error_sound_frequency_ms == 0) {
            if (!is_view) {
                var audio = document.getElementById("audio_error");
                audio.volume = fight_rules.error_sound_volume;
                audio.play();
            }
        }
    }

    // osaekomi buttons
    start_stop = document.getElementById('osaekomi_start_stop');
    start_stop_img = document.getElementById('osaekomi_start_stop_img');
    start_stop_img.classList.remove('fa-play');
    start_stop_img.classList.remove('fa-stop');
    start_stop_img.classList.remove('fa-repeat');
    if (fight_state.osaekomi_running) {
        update_tooltip(start_stop, 'Toketa (W)');
        start_stop_img.classList.add('fa-stop');
    } else if (fight_state.osaekomi_ms == 0) {
        update_tooltip(start_stop, 'Osaekomi (W)');
        start_stop_img.classList.add('fa-play');
    } else {
        update_tooltip(start_stop, 'Reset & Osaekomi (W)');
        start_stop_img.classList.add('fa-repeat');
    }

    pause_continue = document.getElementById('osaekomi_pause_continue');
    pause_continue_img = document.getElementById('osaekomi_pause_continue_img');
    pause_continue_img.classList.remove('fa-pause');
    pause_continue_img.classList.remove('fa-play');
    if (fight_state.osaekomi_running) {
        update_tooltip(pause_continue, 'Pause');
        pause_continue_img.classList.add('fa-pause');
    } else if (fight_state.osaekomi_ms == 0) {
        update_tooltip(pause_continue, 'Continue (C)');
        pause_continue_img.classList.add('fa-play');
    } else {
        update_tooltip(pause_continue, 'Continue (C)');
        pause_continue_img.classList.add('fa-play');
    }

    reset = document.getElementById('osaekomi_reset');
    reset.classList.remove('disabled');
    if (fight_state.osaekomi_running) {
        // leave enabled
    } else if (fight_state.osaekomi_ms == 0) {
        reset.classList.add('disabled');
    } else {
        // leave enabled
    }

    // points
    for (var i=0;i<2;i++) {
        points = fight_state.points[i];
        for (const point in points){
            div_point_id = 'point_' + i + '_' + point;
            div_point = document.getElementById(div_point_id);
            if (div_point == null) {
                if (! div_point_ids_warned_about.has(div_point_id)) {
                    div_point_ids_warned_about.add(div_point_id);
                    console.warn("Point", point, "has no div tag under id", div_point_id);
                }
            } else {
                div_point.innerHTML = points[point];
            }
        }
    }
}

function format_time_seconds(milliseconds) {
    var total_seconds = Math.floor(milliseconds / 1000);
    return total_seconds.toString();
}

/**
 * Returns M:SS
 * - On negative inputs, remove the sign from the output
 */
function format_time_minutes(milliseconds) {
    var seconds =  Math.floor(Math.abs(milliseconds / 1000));

    var minutes = Math.floor(seconds / 60);
    minutes = Math.abs(minutes);

    seconds = Math.abs(seconds);
    seconds = seconds % 60;

    var formatted_time = minutes.toString() + ':' + (seconds < 10 ? '0' : '') + seconds;

    return formatted_time;
}

/**
 * 
 * @returns tenths of seconds
 * - On negative inputs, remove the sign from the output
 */
function format_time_tenths(milliseconds) {
    tenths = Math.floor((milliseconds % 1000) / 100);
    if (tenths < 0) {
        tenths = -tenths;
        tenths %= 10;
    }
    return tenths.toString();
}

function central_clock_time_click() {
    central_clock_pause_continue();
}

function central_clock_pause_continue() {
    if (fight_state.central_clock_running) {
        matte();
    } else {
        osaekomi_reset();
        hajime();
    }
}

function osaekomi_start_stop() {
    if (fight_state.osaekomi_running) {
        osaekomi_pause();
    } else {
        osaekomi_reset();
        hajime();
        osaekomi();
    }
}

function osaekomi_pause_continue() {
    if (fight_state.osaekomi_running) {
        osaekomi_pause();
    } else {
        osaekomi_continue();
    }
}

function total_fight_time_reset_change() {
    const minutes_input = document.getElementById("total_fight_time_reset_minutes");
    const minutes = get_number_from_input(minutes_input);

    const seconds_input = document.getElementById("total_fight_time_reset_seconds");
    const seconds = get_number_from_input(seconds_input);

    fight_rules.total_fight_time = minutes * 60 * 1000 + seconds * 1000;
    // button is automatically updated in function update_display
}
total_fight_time_reset_change();

function golden_score_time_set_change() {
    const minutes_input = document.getElementById("golden_score_time_set_minutes");
    const minutes = get_number_from_input(minutes_input);

    const seconds_input = document.getElementById("golden_score_time_set_seconds");
    const seconds = get_number_from_input(seconds_input);

    const ms = minutes * 60 * 1000 + seconds * 1000;

    var element = document.getElementById("golden_score_time_reset_time");
    element.innerHTML = format_time_minutes(ms);

    return ms;
}
golden_score_time_set_change(); // update the display once

function reset_for_golden_score() {
    const minutes_input = document.getElementById("golden_score_time_set_minutes");
    minutes_input.value = 0;
    const seconds_input = document.getElementById("golden_score_time_set_seconds");
    seconds_input.value = 0;

    matte();
    const ms = golden_score_time_set_change()
    fight_state.central_clock_ms = ms;
    fight_state.is_golden_score = true;
}

function central_clock_set_change() {
    const minutes_input = document.getElementById("central_clock_set_minutes");
    const minutes = get_number_from_input(minutes_input);

    const seconds_input = document.getElementById("central_clock_set_seconds");
    const seconds = get_number_from_input(seconds_input);

    const ms = minutes * 60 * 1000 + seconds * 1000;

    var element = document.getElementById("central_clock_set_time");
    element.innerHTML = format_time_minutes(ms);

    return ms;
}
central_clock_set_change(); // update the display once

function central_clock_set() {
    fight_state.is_golden_score = false;
    fight_state.central_clock_ms = central_clock_set_change();
}

function get_number_from_input(input) {
    if (input.value == "") {
        return 0;
    } else {
        return parseInt(input.value);
    }
}

/**
 * Set the osaekomi seconds to a given value
 */
function apply_osaekomi_seconds() {
    // record and remove osaekomi holder
    var osaekomi_holder = fight_state.osaekomi_holder;
    osaekomi_assign(-1, false);

    const seconds_input = document.getElementById("osaekomi_seconds_input");
    const seconds = parseInt(seconds_input.value);
    fight_state.osaekomi_ms = seconds * 1000;

    // set osaekomi holder again (this automatically assigns points correctly)
    osaekomi_assign(osaekomi_holder, false);
}


/**
 * Configure all fight rules
 */
const fight_rules_element = document.getElementById("fight_rules");
fight_rules_element.value = JSON.stringify(fight_rules, null, 2);
function set_fight_rules() {
    const fight_rules_string = fight_rules_element.value;
    fight_rules = JSON.parse(fight_rules_string);
}

//////////
// KEYS //
//////////

function register_keys() {
    document.body.addEventListener("keydown", (event) => {
        var ignore = false;

        // element on which the event was originally fired
        source = event.target,
        // exclude these elements
        exclude = ['input', 'textarea'];
        if (exclude.indexOf(source.tagName.toLowerCase()) !== -1) {
            // process the keypress normally
            return;
        }

        if (event.keyCode == 32) { // space
            central_clock_time_click();
            ignore = true;
        }

        if (event.keyCode == 65) { // A
            osaekomi_assign(0);
            ignore = true;
        }
        if (event.keyCode == 87) { // W
            osaekomi_start_stop();
            ignore = true;
        }
        if (event.keyCode == 83) { // S
            osaekomi_reset();
            ignore = true;
        }
        if (event.keyCode == 68) { // D
            osaekomi_assign(1);
            ignore = true;
        }
        if (event.keyCode == 67) { // C
            osaekomi_continue();
            ignore = true;
        }

        var fighter = null;
        var point = null;
        if (event.keyCode == 49 || event.keyCode == 97) { // 1
            fighter = 0;
            point = 'ippon';
        }
        if (event.keyCode == 50 || event.keyCode == 98) { // 2
            fighter = 0;
            point = 'wazari'
        }
        if (event.keyCode == 51 || event.keyCode == 99 ) { // 3
            fighter = 0;
            point = 'shido'
        }
        if (event.keyCode == 52 || event.keyCode == 100) { // 4
            fighter = 1;
            point = 'ippon';
        }
        if (event.keyCode == 53 || event.keyCode == 101) { // 5
            fighter = 1;
            point = 'wazari';
        }
        if (event.keyCode == 54 || event.keyCode == 102) { // 6
            fighter = 1;
            point = 'shido';
        }
        if (fighter != null) {
            if (event.shiftKey || event.ctrlKey) {
                remove_point(fighter, point);
            } else {
                add_point(fighter, point);
            }
            ignore = true;
        }

        if (event.keyCode == 13 && fight_rules.enable_reset_by_enter) { // Enter
            reset_all();
            ignore = true;
        }

        if (ignore) {
            event.preventDefault();
        }
    });
}

//////////
// BELL //
//////////

function ring_bell() {
    if (! is_view) {
        var audio = document.getElementById('audio_bell');
        audio.volume = fight_rules.win_sound_volume;
        audio.play();
    }
}

//////////////////
// MASTER TIMER //
//////////////////

/**
 * A custom timer that compensates for delays, i.e., runs multiple time
 * steps if it is behind schedule
 */
var master_timer_next_tick_ms = null;
var master_timer_delta_max_reported = 0;
var master_timer_n_calls = 0;
var master_timer_first_tick_ms;
var master_timer_function = null;
var master_timer_final = null;
function master_timer_handler() {
    if (master_timer_next_tick_ms == null) {
        master_timer_next_tick_ms = window.performance.now();
        master_timer_first_tick_ms = master_timer_next_tick_ms;
    }
    var now = window.performance.now();

    // check performance
    master_timer_n_calls += 1;
    var average_call_frequency = (now - master_timer_first_tick_ms) / master_timer_n_calls;
    if (master_timer_n_calls % 1000 == 0) {
        console.log(`Average call frequency: ${average_call_frequency}ms`);
    }

    var delta = now-master_timer_next_tick_ms;
    if (delta >= master_timer_ms * 1.1 && delta > master_timer_delta_max_reported && master_timer_n_calls >= 1000) {
        master_timer_delta_max_reported = delta;
        console.warn(`Master timer is behind. We would like to run it every ${master_timer_ms}ms, now is ${now}ms and the next tick is only at ${master_timer_next_tick_ms}ms (Delta: ${delta}ms)`);
    }

    // run all time steps until now
    while (master_timer_next_tick_ms <= now) {
        master_timer_function();
        master_timer_next_tick_ms += master_timer_ms;
    }

    // set timer for next call
    delay_until_next = Math.max(0, master_timer_next_tick_ms - now);
    setTimeout(master_timer_handler, delay_until_next);

    // wrap up
    master_timer_final();
}


//////////
// VIEW //
//////////

const broadcast = new BroadcastChannel("fight_state");

function broadcast_fight_state() {
    broadcast.postMessage(fight_state);
    // var fight_state_string = JSON.stringify(fight_state);
    // localStorage.setItem('fight_state', fight_state_string);
}

/**
 * Logic to enable the view-only window
 */
function display_view_only() {
    var div_body = document.querySelector('body');
    div_body.style.overflow = 'hidden';

    var optionals = document.getElementsByClassName('optional');

    for(i = 0; i < optionals.length; i++) {
        optionals[i].classList.add('hidden');
    }

    window.scrollTo(0,0);
}


function scroll_down() {
    const element = document.getElementById("usage");
    element.scrollIntoView({ behavior: "smooth" });
}

// hide button once we are scrolling
const scroll_down_button = document.getElementById('scroll_down');
window.addEventListener('scroll', () => {
    scroll_down_button.style.display = 'none';
});

///////////
// START //
///////////

const url_params = new URLSearchParams(window.location.hash.slice(1));
const is_view = url_params.has('view');

if (is_view) {
    display_view_only();

    broadcast.onmessage = (event) => {
        fight_state = event.data;
    }

    master_timer_function = function() {};
    master_timer_final = update_display;
} else {
    master_timer_function = master_timer_tick;
    master_timer_final = function() {
        update_display();
        broadcast_fight_state();
    };
    register_keys();
}
master_timer_handler();