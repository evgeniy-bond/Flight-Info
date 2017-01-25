var result = [];

$(document).ready(function () {

    //set date in form
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'],
        days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    var mainDate = new Date(),
        year = mainDate.getFullYear(),
        date = mainDate.getDate(),
        day,
        month,
        hour;


    // set date in header
    months.forEach(function (item, i) {
        if (i == mainDate.getMonth()) month = item;
    });

    days.forEach(function (item, i) {
        if (i == mainDate.getDay()) day = item;
    });

    $('.date').text(date + ' ' + month + ', ' + day);


    //set default values in form
    month = mainDate.getMonth() + 1;
    if (month < 10) month = '0' + month;
    $('input[name="date"]').val(year + '-' + month + '-' + date);

    hour = mainDate.getHours();
    if (hour < 10) hour = '0' + hour;
    $('input[name="initial-time"]').val(hour + ':' + '00');


    //set clock
    function updateTime() {
        var mainDate = new Date(),
            hours = mainDate.getHours(),
            minutes = mainDate.getMinutes();

        if (hours < 10) hours = '0' + hours;
        if (minutes < 10) minutes = '0' + minutes;

        $('.inner-hours').text(hours);
        $('.inner-minutes').text(minutes);

        if ($('.blink').css('opacity') == 1) {
            $('.blink').css('opacity', '0');
        } else {
            $('.blink').css('opacity', '1');
        }
    }
    setInterval(updateTime, 500);


    //get values from form
    $('.btn-group').click(function (e) {
        e.preventDefault();
        $('#root').empty();

        var target = e.target,
            flag = true,

            values = {
                airport: $('select[name="airport"]').val(),
                date: $('input[name="date"]').val().replace(/-/g, '/'),
                initialTime: $('input[name="initial-time"]').val().split(':')[0],
                timeInterval: $('input[name="time-interval"]').val()
            };

        $('.btn-group a.btn').each(function () {
            if ($(this).hasClass('btn-primary')) {
                $(this).removeClass('btn-primary');
            }
        });

        if ($(target).data('value') == 'departures') {
            $(target).addClass('btn-primary');
            values.flightType = 'dep';

        } else if ($(target).data('value') == 'arrivals') {
            $(target).addClass('btn-primary');
            values.flightType = 'arr';
        }

        // check field to fill
        for (var key in values) {
            if (!values[key]) {
                showAlert();
                flag = false;
                break;
            } else {
                flag = true;
            }
        }

        if (flag) loadFlights(values);

        function showAlert() {
            $(".alert").show();
            setTimeout(function () { $(".alert").hide(); }, 2000);
        }
    });

    //load flights from api
    function loadFlights(values) {
        // airport
        var requestedAirport = values.airport,
            // flightType
            flightType = values.flightType,
            // date
            requestedDate = values.date,
            // initialTime
            requestedHour = values.initialTime,
            // timeInterval
            requestedNumHours = values.timeInterval;

        var url = 'https://api.flightstats.com/flex/flightstatus/rest/v2/jsonp/airport/status/' + requestedAirport + '/' + flightType + '/' + requestedDate + '/' + requestedHour + '\?appId=e02ef204\&appKey=4dde8e859605616094b4557d8da88f9b\&utc=false&numHours=' + requestedNumHours;

        $.ajax({
            url: url,
            type: 'GET',
            jsonp: "callback",
            dataType: 'jsonp',
            success: function (data) {
                getFullData(data, requestedAirport, flightType);
            }
        });
    }

    function getFullData(data, fsCode, flightType) {
        // full data about flights
        var airport = data.appendix.airports,
            airlines = data.appendix.airlines,
            equipments = data.appendix.equipments,
            flightStatuses = data.flightStatuses,
            reg = /\d\d:\d\d/;


        flightStatuses.forEach(function (flight, i) {

            var carrier = findCarrier(flight.carrierFsCode),
                city1,
                departureAirportFsCode = flight.departureAirportFsCode,
                city2,
                arrivalAirportFsCode = flight.arrivalAirportFsCode,
                departureDate = flight.departureDate.dateLocal.match(reg),
                arrivalDate = flight.arrivalDate.dateLocal.match(reg),
                equipment = findEquipment(flight.flightEquipment.scheduledEquipmentIataCode),
                flightNumber = flight.flightNumber,
                status = findStatus(flight.status);

            //determine cities
            if (flightType == 'dep') {
                city1 = findAirport(fsCode);
                city2 = findCity(flight.arrivalAirportFsCode);

            } else if (flightType == 'arr') {
                city1 = findCity(flight.departureAirportFsCode);
                city2 = findAirport(fsCode);
            }

            //data with values
            var data = {
                carrier: carrier,
                city1: city1,
                departureAirportFsCode: departureAirportFsCode,
                city2: city2,
                arrivalAirportFsCode: arrivalAirportFsCode,
                departureDate: departureDate,
                arrivalDate: arrivalDate,
                equipment: equipment,
                flightNumber: flightNumber,
                status: status
            };

            result.push(data);

        });

        //sort by time
        result.sort(function (prev, cur) {
            if (flightType == 'dep') {
                return Number(prev.departureDate[0].split(':').join('')) - Number(cur.departureDate[0].split(':').join(''));
            }
            if (flightType == 'arr') {
                return Number(prev.arrivalDate[0].split(':').join('')) - Number(cur.arrivalDate[0].split(':').join(''));
            }
        });

        loadToPage();


        //secondary functions

        function findCity(cityCode) {
            for (var i = 0; i < airport.length; i++) {
                if (cityCode == airport[i].cityCode) {
                    return airport[i].city;
                }
            }
        }

        function findAirport(fsCode) {
            var airports = {
                svo: 'Sheremetyevo',
                dme: 'Domodedovo',
                vko: 'Vnukovo'
            };

            for (var key in airports) {
                if (key == fsCode) {
                    return airports[key];
                }
            }
        }

        function findCarrier(carrierFsCode) {
            var carrier = {};
            for (var i = 0; i < airlines.length; i++) {
                if (carrierFsCode == airlines[i].fs) {
                    carrier.name = airlines[i].name;
                    break;
                }
            }
            carrier.src = 'https://airhex.com/content/logos/airlines_' + carrierFsCode + '_200_55_r.png?md5apikey=362d3d7203f6257c50c2431841b36bb3';

            return carrier;
        }

        function findStatus(status) {
            var statuses = {
                A: "Active",
                C: "Canceled",
                D: "Diverted",
                DN: "Data source needed",
                L: "Landed",
                NO: "Not Operational",
                R: "Redirected",
                S: "Scheduled",
                U: "Unknown"
            };

            for (var key in statuses) {
                if (status == key) {
                    return statuses[key];
                }
            }
        }

        function findEquipment(code) {
            for (var i = 0; i < equipments.length; i++) {
                if (code == equipments[i].iata) {
                    return equipments[i].name;
                }
            }
        }

        function loadToPage() {
            var tmpl = _.template($('#list-template').html());
            $('#root').append(tmpl({ data: result }));
            result = [];
        }
    }
});


