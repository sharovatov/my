/**
 * @returns {object} array of two elements - jscript engine and mshtml engines versions
 */
function getIEVersionInfo(){
	var versions = [6,7,8,9,10],
		jscript = 0, mshtml = 0,
		len = versions.length, str = '', i = 0, elem,
		p1 = '<!--[if IE ', p2 = ']><b class="ie', p3 = '"></b><![endif]-->';
	/*@cc_on jscript = @_jscript_version; @*/
	if (jscript > 0) {
		for (;i<len;++i) str += p1 + versions[i] + p2 + versions[i] + p3;
		elem = document.createElement('div');
		elem.innerHTML = str;
		mshtml = parseInt(elem.firstChild.className.substring(2), 0);
		elem = null;
	}
	return [jscript,mshtml];
}