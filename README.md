# Judo Scoreboard

Judo Scoreboard to track fights at judo tournaments.

## Example screenshots

Control panel:

![Screenshot](Screenshot-edit.png)

View only:

![Screenshot](Screenshot-view.png)

## See it in action

Simply browse [here](https://bichselb.github.io/judo-scoreboard/scoreboard/) to
see the scoreboard in action.

## Learn more

To learn more about the scoreboard and how to use it, see
[here](https://bichselb.github.io/judo-scoreboard/scoreboard/#usage).

## Discussion

Advantages of this scoreboard:

- This scoreboard does not need to be installed, it is straight-forward to run
  via your browser.
- This scoreboard supports a high degree of flexibility through [custom
  configurations](https://bichselb.github.io/judo-scoreboard/scoreboard/#config),
  such as:
  - Awarding more than one Ippon
  - Configuring whether and when to auto-award Yuko/Wazari/Ippon during Osaekomi
  - Configuring whether the clock should be stopped on certain events (e.g. upon
    Ippon or upon second Wazari through Osaekomi)
- The [AGPL license](./LICENSE.md) ensures the software is free to use, modify,
  and share. This means users can adapt it as needed and even offer paid
  services like custom deployments and support, as long as any modifications
  remain open-source.
- The implementation is using standard technologies (HTML, Javascript, CSS
  including Bootstrap) and is therefore easy to adapt or extend. The key fight
  logic is in function `master_timer_tick` of
  [scoreboard.js](scoreboard/scripts/scoreboard.js).

Disadvantages of this scoreboard:

- This scoreboard is limited to scoring and tracking ongoing matches; it does
  not include features for managing or scheduling upcoming fights.
