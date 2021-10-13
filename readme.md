# Forpsi Dynamic DNS

## Instalace
```bash
git clone git@github.com:VojtaSkarin/Forpsi-DDNS.git
sh setup_xxx.sh
# add this to /etc/rc.local
cd /home/pi/Forpsi-DDNS && FORPSI_LOGIN=login FORPSI_PASSWORD=password CHROMIUM_PATH=/usr/bin/chromium_browser node /home/pi/Forpsi-DDNS/fddns.js 1>>/home/pi/Forpsi-DDNS/log 2>>/home/pi/Forpsi-DDNS/log &
```

## Popis
FDDNS je klient pro automatickou aktualizace A záznamu v DNS tabulce v registru poskytovatele Forpsi.
