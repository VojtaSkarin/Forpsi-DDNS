const https = require('https')
const fs = require('fs')

const emptyRoutine = input => {};

function log(string) {
	console.log(new Date().toLocaleString(), string);
}

function request(options, data, routineData, routineResponse) {
	req = https.request(options, res => {
		data = ''
		
		res.on('data', chunk => {
			data += chunk
		})
		
		res.on('end', () => {
			routineData(data);
			routineResponse(res);
		})
	});
	
	req.on('error', e => {
		log('Error while processing https request.');
		console.log(e);
		
		// Repeat request each 10 mins until internet connection reestablished
		setTimeout(() => request(options, data, routineData, routineResponse), 10 * 60 * 1000);
	});
	
	req.write(data);
	
	req.end();
}

// Get current IP
function getCurrentIp() {
	currentIp = ''

	options = {
		protocol: 'https:',
		host: 'api.ipify.org',
		path: '',
		port: 443,
		method: 'GET'
	}

	request(options, '', result => {
		currentIp = result
		
		log('Current external ip is ' + currentIp)
		
		getListedIp(currentIp)
	}, emptyRoutine);
}

// Get listed ip
function getListedIp(currentIp) {
	listedIp = ''

	options = {
		protocol: 'https:',
		host: 'dns.google',
		path: '/resolve?name=zemechvaly.cz&amp;type=A',
		port: 443,
		method: 'GET'
	}

	request(options, '', result => {
		json = JSON.parse(result)
		
		listedIp = json.Answer[0].data
	
		log('Current listed ip is ' + listedIp)
		
		if (currentIp != listedIp) {
			log('Listed ip is outdated. Updating...')
			
			logIn(currentIp, listedIp)
		} else {
			log('Listed ip is up to date.');
		}
	}, emptyRoutine);
}

function logIn(currentIp, listedIp) {
	options = {
		protocol: 'https:',
		hostname: 'admin.forpsi.com',
		path: '/',
		port: 443,
		method: 'POST',
		headers: {
			'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
			'Accept-Encoding': 'gzip, deflate, br',
			'Accept-Language': 'cs-CZ,cs;q=0.9,en-GB;q=0.8,en;q=0.7',
			'Cache-Control': 'max-age=0',
			'Connection': 'keep-alive',
			'Content-Length': '72',
			'Content-Type': 'application/x-www-form-urlencoded',
			'Cookie': 'LANG=cz; _ga=GA1.2.952210824.1636921116; _gid=GA1.2.1252681959.1636921116; session=9ta76l0h8qt5rdp7d0tsg8c5i2; _gat=1',
			'Host': 'admin.forpsi.com',
			'Origin': 'https://admin.forpsi.com',
			'Referer': 'https://admin.forpsi.com/index.php',
			'sec-ch-ua': '"Google Chrome";v="95", "Chromium";v="95", ";Not A Brand";v="99"',
			'sec-ch-ua-mobile': '?0',
			'sec-ch-ua-platform': '"Windows"',
			'Sec-Fetch-Dest': 'document',
			'Sec-Fetch-Mode': 'navigate',
			'Sec-Fetch-Site': 'same-origin',
			'Sec-Fetch-User': '?1',
			'Upgrade-Insecure-Requests': '1',
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36'
		}
	};
	
	data = 'login_action=client_login&user_name=' + process.env.FORPSI_LOGIN + '&password=' + process.env.FORPSI_PASSWORD;

	request(options, data, emptyRoutine, response => {
		cookies = response.headers['set-cookie'];
		fauth = cookies[1].split('; ')[0];
		session = cookies[2].split('; ')[0];
		
		log('Logged to forpsi.');
		log(fauth);
		log(session);
		
		update(currentIp, listedIp, fauth, session);
	});
}

function update(currentIp, listedIp, fauth, session) {
	options = {
		protocol: 'https:',
		hostname: 'admin.forpsi.com',
		path: '/domain/domains-dns.php?id=1616858&new=1',
		port: 443,
		method: 'POST',
		headers: {
			'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
			'Accept-Encoding': 'gzip, deflate, br',
			'Accept-Language': 'cs-CZ,cs;q=0.9,en-GB;q=0.8,en;q=0.7',
			'Cache-Control': 'max-age=0',
			'Connection': 'keep-alive',
			'Content-Length': '244',
			'Content-Type': 'application/x-www-form-urlencoded',
			'Cookie': 'LANG=cz; _ga=GA1.2.952210824.1636921116; _gid=GA1.2.1252681959.1636921116; ' + fauth + '; ' + session + '; _gat=1; cookiesDirective=1',
			'Host': 'admin.forpsi.com',
			'Origin': 'https://admin.forpsi.com',
			'Referer': 'https://admin.forpsi.com/domain/domains-dns.php?id=1616858&new=1',
			'sec-ch-ua': '"Google Chrome";v="95", "Chromium";v="95", ";Not A Brand";v="99"',
			'sec-ch-ua-mobile': '?0',
			'sec-ch-ua-platform': '"Windows"',
			'Sec-Fetch-Dest': 'document',
			'Sec-Fetch-Mode': 'navigate',
			'Sec-Fetch-Site': 'same-origin',
			'Sec-Fetch-User': '?1',
			'Upgrade-Insecure-Requests': '1',
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36'
		}
	};
	
	data = 'type=A&url=%2Fdomain%2Fdomains-dns.php%3Fid%3D1616858&ak=record_save&r_ID=22549&srv_service=&srv_protocol=_tcp&tlsa_port=&tlsa_protocol=_tcp&name=&ttl=60&mx_priority=10&srv_priority=10&srv_weight=&srv_port=&flags=0&tag=issue&rdata=' + currentIp;
	
	request(options, data, emptyRoutine, response => {
		log('Sucessfully updated.');
	});
}

log('Launching Forpsi DDNS.')

getCurrentIp();

// Repeat query each two hours
setInterval(getCurrentIp, 2 * 60 * 60 * 1000);
