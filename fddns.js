const puppeteer = require('puppeteer');
const https = require('https')
const fs = require('fs')

function log(string) {
	console.log(new Date().toLocaleString(), string);
}

function request(options, routine) {
	https.get(options, res => {
		data = ''
		
		res.on('data', chunk => {
			data += chunk
		})
		
		res.on('end', () => {
			routine(data)
		})
	})
}

// Get current IP
function getCurrentIp() {
	currentIp = ''

	options = {
		host: 'api.ipify.org',
		protocol: 'https:',
		port: 443,
		method: 'GET'
	}

	request(options, result => {
		currentIp = result
		
		log('Current external ip is ' + currentIp)
		
		getListedIp(currentIp)
	})
}

// Get listed ip
function getListedIp(currentIp) {
	listedIp = ''

	options = {
		host: 'dns.google',
		path: '/resolve?name=zemechvaly.cz&amp;type=A',
		port: 443,
		method: 'GET'
	}

	request(options, result => {
		json = JSON.parse(result)
		
		listedIp = json.Answer[0].data
	
		log('Current listed ip is ' + listedIp)
		
		if (currentIp != listedIp) {
			log('Listed ip is outdated. Updating...')
			
			update(currentIp, listedIp)
		} else {
			log('Listed ip is up to date.');
		}
	})
}

async function update(currentIp, listedIp) {
	const browser = await puppeteer.launch({
		headless: true,
		executablePath: process.env.CHROMIUM_PATH,
	});
	const page = await browser.newPage();
	await page.goto('https://admin.forpsi.com');

	page.evaluate((login, password) => {
		document.getElementById('user_name').value = login;
		document.getElementById('password').value = password;
		document.getElementsByClassName('submit')[1].childNodes[0].click();		
	}, process.env.FORPSI_LOGIN, process.env.FORPSI_PASSWORD);
	
	await page.waitForNavigation({
		waitUntil: 'networkidle0'
	});
	
	page.evaluate(() => {
		document.getElementsByClassName('bottomColumn')[0].firstElementChild.click();
		//document.getElementsByClassName('td-detail-third')[6].lastElementChild.click()
	});
	
	await page.waitForNavigation({
		waitUntil: 'networkidle0'
	});
	
	page.evaluate(() => {
		document.getElementsByClassName('rowl alternate')[0].children[1].firstElementChild.click();
	})
	
	await page.waitForNavigation({
		waitUntil: 'networkidle0'
	});
	
	page.evaluate(() => {
		document.getElementsByClassName('td-detail-third')[6].lastElementChild.click()
	});
	
	await page.waitForNavigation({
		waitUntil: 'networkidle0'
	});
	
	page.evaluate((currentIpCopy) => {
		document.getElementsByName('rdata')[1].value = currentIpCopy;
		document.getElementsByClassName('edit_row')[0].click();
	}, currentIp);
	
	setTimeout(() => page.evaluate(() => {
		document.getElementsByClassName('btn blue small')[3].click()
	}), 1000)
	
	log('Sucessfully updated.')
	
}

log('Launching Forpsi DDNS.')

getCurrentIp();

// Repeat query each hour
setInterval(getCurrentIp, 60 * 60 * 1000);
