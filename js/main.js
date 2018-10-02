RegExp.escape = function (s) {
	if (s) {
		return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
	}
	return '';
};

jQuery(function () {

	$('.nav-tabs a').on('click', function (e) {
		//e.preventDefault();
		$(this).tab('show');
	});

	$('form').on('submit', function (ev) {
		ev.preventDefault();
	});

});


jQuery(function () {
	var CONF_SEPARATOR_SYMBOL_el = $('#conf-separator-symbol');
	var CONF_SEPARATOR_TEXT_DELIMITER_el = $('#conf-text-delimiter');

	var button_headers_acquire = $('#headers-acquire');

	button_headers_acquire.on('click', function (ev) {
		ev.preventDefault();
		prepareHeaders();
		prepareTransforms();
		$('#create-sample-output').removeClass('hidden');
	})

	$('#conf-headers-mapping').on('input', function (ev) {
		prepareHeaders();
		prepareTransforms();
	})

	var _clearFromTextDelimiter = function (string, textDelimiter) {
		if (textDelimiter === undefined) {
			var textDelimiter = CONF_SEPARATOR_TEXT_DELIMITER_el.val();
		}
		var checkDelim = textDelimiter.length > 0;
		var checkStart = string.substring(0, textDelimiter.length) == textDelimiter;
		var checkEnd = string.substring(string.length - textDelimiter.length, string.length) == textDelimiter;
		if (checkDelim && checkStart && checkEnd) {
			string = string.substring(textDelimiter.length);
			string = string.substring(0, string.length - textDelimiter.length);
		}
		return string;
	}

	var prepareHeaders = function () {
		var headersString = $('#conf-headers-mapping').val().replace(/\\r/g, '').split("\n")[0];
		var items = headersString.split(CONF_SEPARATOR_SYMBOL_el.val());
		var textDelimiter = CONF_SEPARATOR_TEXT_DELIMITER_el.val();
		var headersEl = $('[data-element="fields-mapping-items-headers"]');
		headersEl.removeClass('hidden');
		var template = Handlebars.compile($('[data-element="fields-mapping-items-headers-template"]').html());
		$('[data-element="fields-mapping-item"]').remove();
		_.each(items.reverse(), function (i) {
			var i = _clearFromTextDelimiter(i, textDelimiter);
			var headerHtml = template({ name: i, field: i });
			headersEl.after(headerHtml);
		})
	};

	var prepareTransforms = function () {
		var template = Handlebars.compile($('[data-element="fields-transform-items-template"]').html());
		var itemsContainer = $('[data-element="fields-transform-items"]');
		$('[data-element="fields-transform-item"]').remove();
		_.each($('[data-element="fields-mapping-item"]').toArray(), function (item, index) {
			var name = $('input', item).val();
			var transformHtml = template({ counter: index, name: name });
			itemsContainer.append(transformHtml);
		});
	};

	$('#add-rule-button').on('click', function (ev) {
		ev.preventDefault();
		addRule();
	});

	var prepareBasicOutputTemplate = function () {
		var textarea = $('[id="data-output"]');
		var rows = $('input', '[data-element="fields-mapping-item"]');
		var s = '';
		_.each(rows, function (r, index) {
			s += '{{' + $(r).val() + '}}';
			if (index != (rows.length - 1)) {
				s += ' <span style="color: red">we</span> ';
			};
		});
		textarea.val(s);
	};

	$('#create-sample-output').on('click', function (ev) {
		ev.preventDefault();
		prepareBasicOutputTemplate();
	})

	var addRule = function () {
		var template = Handlebars.compile($('[data-element="rule-template"]').html());
		ruleHtml = template();
		$('[data-element="post-process-items-headers"]').removeClass('hidden');
		$('[data-element="post-process-items"]').append(ruleHtml);
	};


	$('body').delegate('[name="post-process-delete"]', 'click', function (ev) {
		ev.preventDefault()
		var p = $(this).parents('[data-element="post-process-item"]');
		p.remove();
	});

	$('body').delegate('[name="fields-mapping-items-value"]', 'input', function (ev) {
		prepareTransforms();
	});


	$('#go').on('click', function (ev) {
		ev.preventDefault();
		var btn = $(this)
		btn.button('loading');
		doMagic();
		btn.button('reset');
	})

	var applyLoading = function () {
		var inputs = $('input').toArray();
		var textareas = $('textarea').toArray();
		var all = _.union(inputs, textareas);
		_.each(all, function (item) {
			$(item).attr('readonly', true);
		});
	};

	var removeLoading = function () {
		var inputs = $('input').toArray();
		var textareas = $('textarea').toArray();
		var all = _.union(inputs, textareas);
		_.each(all, function (item) {
			var item = $(item);
			item.removeAttr('readonly');
		});
	};

	_.mergeKeysToValues = function (arrKey, arryVal) {
		var obj = {};
		_.each(arrKey, function (k, index) {
			obj[k] = arryVal[index] || undefined;
		})
		return obj;
	}

	var doMagic = function () {
		applyLoading();
		$('#results').empty();
		var trim = jQuery.trim;
		var data = trim($('#data-input').val()).replace(/\\r/, '');
		var rows = data.split('\n');
		var separator = $(CONF_SEPARATOR_SYMBOL_el).val()
		var template = Handlebars.compile($('#data-output').val(), { noEscape: true });

		var headers = $('[name="fields-mapping-items-value"]').toArray();
		headers = _.map(headers, function (el) { return $(el).val(); });

		var emptyReplace = $('#conf-trasform-replace-empty').val();
		var searchStrings = $('[name="fields-transform-item-search"]');
		var replaceStrings = $('[name="fields-transform-item-replace"]');

		var resultString = '';
		_.each(rows, function (row, index) {
			var columns = row.split(separator);
			_.each(columns, function (col, index) {
				var fieldValue = _clearFromTextDelimiter(col);

				//empty replace
				if (fieldValue.length == 0 && emptyReplace.length > 0) {
					fieldValue = emptyReplace;
				}
				else {
					var search = RegExp.escape($(searchStrings.get(index)).val());
					var replace = $(replaceStrings.get(index)).val()
					if (search && search.length > 0) {
						fieldValue = fieldValue.replace(new RegExp(search, "g"), replace);
					}
				}
				columns[index] = fieldValue;
			});
			var mapping = _.mergeKeysToValues(headers, columns);
			var finalHtml = template(mapping);
			resultString += finalHtml + '\n\n';
		});

		var postProcessSearches = $('[name="post-process-search"]').toArray();
		var postProcessReplaces = $('[name="post-process-replace"]');

		_.each(postProcessSearches, function (item, index) {
			var search = RegExp.escape($(item).val());
			var replace = $(postProcessReplaces.get(index)).val()
			resultString = resultString.replace(new RegExp(search, 'g'), replace);
		});

		$('#results').val(resultString);
		removeLoading();
	};

});
