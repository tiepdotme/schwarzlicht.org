var CalendarShell = function () {

	function CalendarShell (_temp) {
		var _ref = _temp === void 0 ? {} : _temp,
			_ref$container = _ref.container,
			container = _ref$container === void 0 ? null : _ref$container,
			_ref$categories = _ref.categories,
			categories = _ref$categories === void 0 ? null : _ref$categories,
			_ref$weekdays = _ref.weekdays,
			weekdays = _ref$weekdays === void 0 ? null : _ref$weekdays,
			_ref$month_names = _ref.month_names,
			month_names = _ref$month_names === void 0 ? null : _ref$month_names,
			_ref$entries = _ref.entries,
			entries = _ref$entries === void 0 ? null : _ref$entries;

		this.calendar = new Calendar({
			siblingMonths: true,
			weekStart: 1 /*monday*/
		});
		this.month_obj = null;
		this.month = 0;
		this.year = 0;
		this.container = container
		this.categories = categories;
		this.entries = entries;
		this.month_names = month_names;
		this.weekdays = weekdays;
	}

	var _proto = CalendarShell.prototype;

	_proto.setup = function setup() {
		// Get Year and Month from window.location
		let desired_date = CalendarShell.getDesiredDate();
		this.year = desired_date.year;
		this.month = desired_date.month;
		this.month_obj = this.calendar.getCalendar(this.year, this.month);
		this.initCalendar();
		this.initEntries();
	};

	_proto.initCalendar = function initCalendar() {
		let year_elem = this.container.querySelector("#calendar-year");
		if(year_elem){
			year_elem.innerHTML = this.year;
		} else {
			console.warn("Fetching node with id #calendar-year failed. Does it exist?");
		}

		let month_elem = this.container.querySelector("#calendar-month");
		if(month_elem){
			month_elem.innerHTML = this.month_names[this.month].name;
		} else {
			console.warn("Fetching node with id #calendar-month failed. Does it exist?");
		}

		let calendar_elem = this.container.querySelector(".calendar");
		if (! calendar_elem){
			return;
		}
		for ( let weekday of this.weekdays ) {
			let weekday_elem = document.createElement("span");
			weekday_elem.classList.add("day-name");
			let weekday_text_elem = document.createTextNode(weekday.abbreviation);
			weekday_elem.appendChild(weekday_text_elem);
			calendar_elem.appendChild(weekday_elem);
		}
		for ( let day of this.month_obj ) {
			let day_elem = document.createElement("div");
			day_elem.classList.add("day");
			if (day.siblingMonth) {
				day_elem.classList.add("day--disabled");
			}
			let day_text_elem = document.createTextNode(day.day);
			day_elem.appendChild(day_text_elem);
			calendar_elem.appendChild(day_elem);
		}
	};

	_proto.previousPage = function previousPage() {
		let prev_month = (this.month - 1) % 12 + 1;
		let prev_year = this.year;
		if (this.month == 0){
			prev_year = this.year > 0 ? this.year - 1 : 0;
			prev_month = 12
			console.log(prev_month)
		}
		return {year: prev_year, month: prev_month}
	};

	_proto.nextPage = function nextPage() {
		let next_month = (this.month + 1) % 12 + 1;
		let next_year = this.year;
		if (this.month == 11){
			next_year = this.year + 1;
		}
		return {year: next_year, month: next_month}
	};

	_proto.filterEntriesForMonth = function filterEntriesForMonth() {
		/* Filter entries, ignore singular events in the wrong year. */
		let filtered_entries = []
		for ( let entry of this.entries[this.month+1] ) {
			const d = new Date(entry.date)
			const ye = new Intl.DateTimeFormat('en', { year: 'numeric' }).format(d)
			if ( !entry.singular || this.year == ye){
				filtered_entries.push(entry)
			}
		}
		return filtered_entries;
	};

	/**
	 * hide entries if their category is inactive
	 * show them if it becomes active again
	 * */
	_proto.updateCategories = function updateCategories() {
		for ( let entry of this.filterEntriesForMonth() ) {
			let category = this.categories[entry.category];
			const da = new Intl.DateTimeFormat('en', { day: 'numeric' }).format(new Date(entry.date));
			let id = "#" + entry.id + "-" + da;
			let entry_elem = this.container.querySelector(id);
			if (category.active){
				entry_elem.classList.remove("hidden");
			} else {
				entry_elem.classList.add("hidden");
			}
		}
	};

	_proto.initEntries = function initEntries() {
		let calendar_elem = this.container.querySelector(".calendar");
		/* counts the number of entries per day, required for entry aligning */
		let day_counter = {}
		for ( let entry of this.filterEntriesForMonth() ) {
			const d = new Date(entry.date)
			const da = new Intl.DateTimeFormat('en', { day: 'numeric' }).format(d)
			if (!(da in day_counter)){
				day_counter[da] = 0;
			}
			day_counter[da]++;
		}
		let current_entry_day_counter = {}
		for ( let entry of this.filterEntriesForMonth() ) {
			const d = new Date(entry.date)
			const da = new Intl.DateTimeFormat('en', { day: 'numeric' }).format(d)
			const ye = new Intl.DateTimeFormat('en', { year: 'numeric' }).format(d)
			for (let day of this.month_obj){
				if (day.day == da && this.month == day.month) {
					entry.loc = CalendarShell.getDayLocation(day, this.month_obj)
					break;
				}
			}
			let id = entry.id + "-" + da
			let entry_elem = document.createElement("section");
			if (!(da in current_entry_day_counter)){
				current_entry_day_counter[da] = 0;
			}
			//let align_selves = ["end", "center", "start"];
			//let align_self = align_selves[day_counter[da]%align_selves.length];
			let align_self = 120 * (current_entry_day_counter[da] / day_counter[da]);
			current_entry_day_counter[da]++;

			entry_elem.classList.add("task");
			entry_elem.classList.add("task--"+entry.category);
			entry_elem.setAttribute("id", id);
			entry_elem.setAttribute("onmouseover", "calendar_detail('#" + id + "', true, false)");
			entry_elem.setAttribute("onmouseout", "calendar_detail('#" + id + "', false, false)");
			entry_elem.setAttribute("onclick", "calendar_detail('#" + id + "', false, true)");
			//entry_elem.setAttribute("style", "grid-row:"+ entry.loc.row +"; grid-column:"+entry.loc.column+"; align-self:"+align_self);
			entry_elem.setAttribute("style", "grid-row:"+ entry.loc.row +"; grid-column:"+entry.loc.column+"; bottom: calc("+align_self +"px)");
			calendar_elem.appendChild(entry_elem);

			let title = entry.name.substring(0,30);
			if (ye > 1){
				title = title + " ("+new String(ye)+")";
			}
			let entry_text_elem = document.createTextNode(title);
			entry_elem.appendChild(entry_text_elem);

			let detail_elem = document.createElement("div");
			detail_elem.classList.add("task__detail");

			let loc_hor = 'left';
			if (entry.loc.column >=5) {
				loc_hor = 'right';
			//	detail_elem.classList.add("far-right");
			} /*else {
				detail_elem.classList.add("far-left");
			}*/
			let loc_vert = 'top';
			if (entry.loc.row >=5) {
			//	detail_elem.classList.add("far-down");
				loc_vert = 'bottom';
			} /*else {
				detail_elem.classList.add("far-up");
			}*/
			detail_elem.setAttribute("style", loc_vert + ": calc(100% + 10px);" + loc_hor + ": 0;");
			detail_elem.setAttribute("id", id + "-detail");
			entry_elem.appendChild(detail_elem);

			let detail_headline_elem = document.createElement("h2");
			let detail_headline_text_elem = document.createTextNode(entry.name);
			detail_headline_elem.appendChild(detail_headline_text_elem);
			detail_elem.appendChild(detail_headline_elem);

			let detail_desc_elem = document.createElement("p");
			detail_desc_elem.innerHTML = entry.description;
			detail_elem.appendChild(detail_desc_elem);
		}
	};

	/** 
	 * Return year and month.
	 * Returns those values as defined in
	 * window.location.hash with format "#yyyy-mm". If window.location.hash
	 * does not match the pattern, the current year and month is returned.
	 */
	CalendarShell.getDesiredDate = function getDesiredMonth() {
		let date = new Date()
		let date_year = date.getFullYear();
		let date_month = date.getMonth();
		let hash_pattern = /^#\d{4}\-\d{2}$/;
		let uri_date = decodeURIComponent(window.location.hash);
		if ( uri_date.match(hash_pattern) ){
			let year_month = uri_date.replace("#","").split("-");
			let year_tmp  = Number(year_month[0]);
			let month_tmp = Number(year_month[1]);
			/* Remove bogus values */
			if (year_tmp < 0 || month_tmp < 0 || month_tmp > 12){
				console.warn("Incorrect year ("+ year_tmp +") or month ("+month_tmp+") values")
			} else {
				date_year = year_tmp;
				date_month = month_tmp - 1;
			}
		}
		return {"year": date_year, "month": date_month}
	}
	/** 
	 * Return row and column on the calendar of the specified day.
	 */
	CalendarShell.getDayLocation = function getDayLocation(day, month) {
		let index = month.indexOf(day);

		let num_rows = Math.ceil(month.length / 7);
		let row = Math.ceil( ((1 + index) / month.length) * num_rows ) + 1;

		let column = (index % 7) + 1;
		return {"column": column, "row": row}
	}


	return CalendarShell;
}();
