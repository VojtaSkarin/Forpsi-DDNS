const puppeteer = require('puppeteer');
const https = require('https')
const FormData = require('form-data')
const fs = require('fs')

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
		host: 'whatsmyip.com',
		port: 443,
		method: 'GET'
	}

	request(options, result => {
		start = result.indexOf('&nbsp;')
		end = result.indexOf('<', start)
			
		currentIp = result.substring(start + 6, end)

		/*parts = ipStr.split('.')
			
		currentIp = parts.map(part => parseInt(part))*/
		
		console.log('Current external ip is ' + currentIp)
		
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
	
		console.log('Current listed ip is ' + listedIp)
		
		if (currentIp != listedIp) {
			console.log('Listed ip is outdated. Updating...')
			
			update(currentIp, listedIp)
		}
	})
}

async function update(currentIp, listedIp) {
	const browser = await puppeteer.launch({headless: false});
	const page = await browser.newPage();
	await page.goto('https://admin.forpsi.com');
	
	page.evaluate(() => {
		document.getElementById('user_name').value = process.env.FORPSI_LOGIN;
		document.getElementById('password').value = process.env.FORPSI_PASSWORD;
		document.getElementsByClassName('submit')[1].childNodes[0].click();		
	});
	
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
	
	console.log('Sucessfully updated')
}

setInterval(getCurrentIp, 300000)