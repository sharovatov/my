function switchState(e) {
    var elem = this.querySelector('.niceSwitcher__input');
    elem.checked = !elem.checked;
}
window.onload = function() {
    var switchers = document.querySelectorAll('.niceSwitcher'),
        i = 0,
        l = switchers.length,
        switcher;
    for (; i<l; ++i) {
        switcher = switchers[i];
        switcher.onclick = switchState;
    }
};