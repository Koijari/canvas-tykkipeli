const kenttaCanvas = document.getElementById('kenttaCanvas'); //Pohjacanvas
const kenttaCtx = kenttaCanvas.getContext('2d');
const piirtoCanvas = document.getElementById('piirtoCanvas'); //pintacanvas
const piirtoCtx = piirtoCanvas.getContext('2d');
const tykkiCanvas = document.getElementById('tykkiCanvas');
const tykkiCtx = tykkiCanvas.getContext('2d');
const kanuuna = new Image();
kanuuna.src = 'kuvat/tykki.png';

const painovoima = 9.81;
let kitka = 1 + Math.random()/10;

const aanet = {
    'laukaus': new Audio('aanet/tykinlaukaus.mp3'),
    'huti': new Audio('aanet/osumaHuti.mp3'),
    'osuma': new Audio('aanet/tykkiOsuma.mp3'),
    'tausta': new Audio('aanet/StartPage.mp3')
};

let osumaTykkiin = false;//estämään tuplaosumat

// maaston koordinaattipisteet
let terrainPoints = [];

let ammukset = [];

function resizeCanvas(){ //cancaksen koko on sama kuin ikkunan koko
    kenttaCanvas.width = window.innerWidth;
    kenttaCanvas.height = 2*window.innerWidth/5; //korkeutta muutettu, syöttökentät mahtuu ruutuun
    piirtoCanvas.width = window.innerWidth;
    piirtoCanvas.height = 2*window.innerWidth/5;
    tykkiCanvas.height = 2*window.innerWidth/5;
    tykkiCanvas.width = window.innerWidth;
}

// jos ikkunan koko muuttuu päivittyyy myös canvas uutta kokoa vastaavaksi
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

document.getElementById('kulma').focus();

// Tykki-luokka
class TykinPutki {
    constructor(x, y, angl) { //lisätty putkensuunta *angl*
        this.x = x;
        this.y = y;
        this.angl = angl;
        this.kulma = 45;
        this.ruuti = 0;
    }
    //tähtäimen piirto
    draw() {
        piirtoCtx.lineWidth = 1;
        piirtoCtx.beginPath();
        piirtoCtx.moveTo(this.x, this.y);
        const tykin_putkiX = this.x + Math.cos(this.kulma * Math.PI / 180) * this.angl;
        const tykin_putkiY = this.y - Math.sin(this.kulma * Math.PI / 180) * 40;
        piirtoCtx.lineTo(tykin_putkiX+10, tykin_putkiY-40);
        piirtoCtx.strokeStyle = 'red';
        piirtoCtx.stroke();
    }
    //uusi kulma säätöä varten
    setAngle(uusiKulma) {
        this.kulma = uusiKulma;
    }
    //uusi ruuti
    setPower(uusiRuuti){
        this.ruuti = uusiRuuti;
    }
};

const tykinPutki1 = new TykinPutki(tykkiCanvas.width*0.055, tykkiCanvas.height*0.94, 60);
const tykinPutki2 = new TykinPutki(tykkiCanvas.width*0.945, tykkiCanvas.height*0.94, -60);

const pelaajat = {
    pelaaja1 : {
       'nimi': sessionStorage.getItem('p1'),
       'lavetti': [piirtoCanvas.width*0.04, piirtoCanvas.height*0.9],
       'putki': tykinPutki1,
       'osumat': 0
   },
   pelaaja2 : {
       'nimi': sessionStorage.getItem('p2'),
       'lavetti': [piirtoCanvas.width*0.93, piirtoCanvas.height*0.9],
       'putki': tykinPutki2,
       'osumat': 0
   }
};

let pelaajaNyt = pelaajat.pelaaja1;
tykkiCtx.font = "bold 20px Comic sans MS";
tykkiCtx.fillStyle = 'yellow';
tykkiCtx.fillText(pelaajaNyt.nimi+'n vuoro', tykkiCanvas.width*0.45, tykkiCanvas.height*0.95);

// Vuoronvaihtofunktio
function vuoronVaihto() {    
    pelaajaNyt = pelaajaNyt === pelaajat.pelaaja1 ? pelaajat.pelaaja2 : pelaajat.pelaaja1;
    //console.log(pelaajaNyt.nimi + "n vuoro.");

    //pelaaja vuoro ruudulla
    tykkiCtx.clearRect(tykkiCanvas.width*0.40, tykkiCanvas.height*0.9, 200, 400)
    tykkiCtx.font = "bold 20px Comic sans MS";
    tykkiCtx.fillStyle = 'yellow';
    tykkiCtx.fillText(pelaajaNyt.nimi+'n vuoro', tykkiCanvas.width*0.45, tykkiCanvas.height*0.95);
  }

// Ammus-luokka
class Ammus {
    constructor(x, y, kulma, ruuti) {
        this.x = x;
        this.y = y;
        this.vx = Math.cos(kulma * Math.PI / 180) * ruuti;
        this.vy = -Math.sin(kulma * Math.PI / 180) * ruuti;
    }

    update() {
        this.vy += painovoima;
        if (pelaajaNyt === pelaajat.pelaaja2) {
            this.x += this.vx;
        } else {
            this.x += -this.vx;
        }
        this.y += this.vy;
        this.vx *= kitka;
        this.vy *= kitka;
        this.checkCollision();
    }

    draw() {
        piirtoCtx.beginPath();
        piirtoCtx.arc(this.x, this.y, 5, 0, Math.PI * 2);
        piirtoCtx.fillStyle = 'black';
        piirtoCtx.fill();        
    }

    checkCollision() {
        const terrainHeight = getTerrainHeightAt(this.x); // Haetaan maaston korkeus tässä x-koordinaatissa
        if (this.y > terrainHeight) { // Tarkistetaan osuma maastoon
            const craterRadius = 40; // Kolon säde
    
            // Tee reikä maastoon 
            kenttaCtx.globalCompositeOperation = 'destination-out';
            kenttaCtx.beginPath();
            kenttaCtx.arc(this.x, terrainHeight, craterRadius, 0, Math.PI * 2);
            kenttaCtx.fill();
            kenttaCtx.globalCompositeOperation = 'source-over';
    
            //  räjähdyskuva
            const rajahdyskuva = new Image()
            rajahdyskuva.src = 'kuvat/blast.gif';
            

            rajahdyskuva.onload = () => {
                
                tykkiCtx.drawImage(rajahdyskuva, this.x - 40, terrainHeight - 40, 100, 100);
                aanet.laukaus.play();
                
                setTimeout(() => {
                    tykkiCtx.clearRect(this.x - 40, terrainHeight - 40, 100, 100);
                }, 1900);
            };
    
            // Tarkista osuma toiseen tykkiin
            this.checkCollision_Tykki(pelaajat.pelaaja1.lavetti,'pelaaja1');
            this.checkCollision_Tykki(pelaajat.pelaaja2.lavetti,'pelaaja2');
            
            return true;
        }
        return false;
    };

    checkCollision_Tykki(tykin_sijainti, pelaaja) { //Törmys toiseen tykkiin
        if (osumaTykkiin) {
            return; // estää tuplaosuman
        }
            const tykkiX = tykin_sijainti[0];
            const tykkiY = tykin_sijainti[1];
            const tykkiWidth = 200;  // Tykin leveys
            const tykkiHeight = 200; // Tykin korkeus    
        
        // Tarkistetaan, osuuko ammus tykkiin 
        if (this.x > tykkiX && this.x < tykkiX + tykkiWidth &&
            this.y > tykkiY && this.y < tykkiY + tykkiHeight) {
            let vastustaja = pelaaja === 'pelaaja1' ? 'pelaaja2' : 'pelaaja1';//vastustajan selvittäminen

            osumaTykkiin = true;
            tykkiCtx.fillStyle = "red"; //ilmoitus ko. asiasta            
                
            pelaajat[vastustaja].osumat++;  // Lisätään yksi osuma
            

            if(vastustaja ==='pelaaja1'){
                tykkiCtx.clearRect(tykkiCanvas.width *0.2, 30, 160,60);
                tykkiCtx.fillText(`Osumat ${pelaajat[vastustaja].nimi}: ${pelaajat[vastustaja].osumat}`, tykkiCanvas.width *0.2, tykkiCanvas.height *0.1);

            }
            else{
                tykkiCtx.clearRect(tykkiCanvas.width- tykkiCanvas.width *0.2,30,160,60 );
                tykkiCtx.fillText(`Osumat ${pelaajat[vastustaja].nimi}: ${pelaajat[vastustaja].osumat}`,
                     tykkiCanvas.width- tykkiCanvas.width *0.2,  tykkiCanvas.height *0.1);
            }            

            setTimeout(()=>{
                tykkiCtx.clearRect(tykkiCanvas.width*0.45 ,tykkiCanvas.height *0.25,200,100);
                osumaTykkiin = false; 
            },2000);
            
            //
            tykkiCtx.clearRect(tykkiX, tykkiY, tykkiWidth, tykkiHeight);
            //Tähän se romutettu tykki?
            aanet.osuma.play();
            const romu = new Image()
            romu.src = 'kuvat/potslojo2.png';
            
            romu.onload = () => {
                
                setTimeout( () => {
                    tykkiCtx.drawImage(romu, tykkiX, tykkiY - 20, 80, 60);
                }, 2000);                
                
                setTimeout(() => {
                    tykkiCtx.clearRect(tykkiX, tykkiY - 20, 100, 100);
                }, 4000);
            };

            setTimeout( () => {
                checkWin(); //tuliko voitto?
                kenttaCtx.clearRect(0,0, kenttaCanvas.width, kenttaCanvas.height);
                kitka = 1 + Math.random()/10; // osuman jälkeen fysiikka muuttuu
                terrainPoints = []; //nollataan vanhan vuoren piirtopisteet
                kanuuna.onload();
                drawTerrain();
            }, 5000); 
        };        
    };
};

//Syöttökenttien arvot ja tyhjennys
function tallennaArvot() {
    document.getElementById('kulma').focus();
    kulma = document.getElementById('kulma').value;
    ruuti = document.getElementById('ruuti').value;
    document.getElementById('kulma').value = '';
    document.getElementById('ruuti').value = '';
    if (pelaajaNyt === pelaajat.pelaaja1) {
        tykinPutki1.setAngle(kulma);    
        piirtoCtx.clearRect(0,0,piirtoCanvas.width,piirtoCanvas.height);
        tykinPutki1.draw();
    } else {
        tykinPutki2.setAngle(kulma);
        piirtoCtx.clearRect(0,0,piirtoCanvas.width,piirtoCanvas.height);
        tykinPutki2.draw();
    }    
}

document.addEventListener('keydown', function(event) {
    
    if (event.key === 'Enter') {
        if (pelaajaNyt === pelaajat.pelaaja1) {
            const ammus = new Ammus(tykinPutki1.x, tykinPutki1.y - 10, kulma || tykinPutki1.kulma, ruuti || tykinPutki1.ruuti);
            ammukset.push(ammus);
            vuoronVaihto();        

        } else if (pelaajaNyt === pelaajat.pelaaja2) {
            const ammus = new Ammus(tykinPutki2.x, tykinPutki2.y - 10, kulma || tykinPutki2.kulma, ruuti || tykinPutki2.ruuti);
            ammukset.push(ammus); 
            vuoronVaihto();       
        }
    }
});

function drawTerrain(){

    //rekvisiitta-aurinko, siirretty, ettei tule vuoren tai pilven päälle
    kenttaCtx.beginPath();
    kenttaCtx.arc(Math.random() * kenttaCanvas.width ,100,40,0,2*Math.PI);
    kenttaCtx.fillStyle = "yellow";
    kenttaCtx.fill();
    kenttaCtx.stroke();
    
    const kenttakuvat = ['kuvat/sora.png','kuvat/ruoho.png','kuvat/ruoho3.png','kuvat/kivi.png','kuvat/hiekka.png'];
    
     const kenttaKuva = new Image();
     kenttaKuva.src = kenttakuvat[Math.floor(Math.random()* kenttakuvat.length)];
     const kuvanNimi = kenttaKuva.src.split('/').pop(); // muuten tulee koko polku
    
     switch (kuvanNimi) {// vaihdetaan tausta kuvaan sopivakjsi
        case 'sora.png': 
            document.body.style.backgroundColor = 'chocolate';
            break;
        case 'ruoho.png': 
            document.body.style.backgroundColor = 'green';
            break;
        case 'ruoho3.png': 
            document.body.style.backgroundColor = 'darkgreen';
            break;
        case 'kivi.png': 
            document.body.style.backgroundColor = 'darkgray';
            break;
        case 'hiekka.png': 
            document.body.style.backgroundColor = 'SandyBrown';
            break;
        
        default:
            document.body.style.backgroundColor = 'green';
            break;
    }
     kenttaKuva.onload = () => {
         
        const kuvio = kenttaCtx.createPattern(kenttaKuva, 'repeat');

        // koordinaatit
        const pisteet = [
            { x: 0, y: kenttaCanvas.height*0.96 }, // aloituspiste
            { x: kenttaCanvas.width * 0.10, y: kenttaCanvas.height*0.96 },//alussa tasainen tila tykille, onko riittävä
            { x: kenttaCanvas.width * 0.15, y: kenttaCanvas.height - Math.random()*400 }, //random korkeudet tässä välissä
            { x: kenttaCanvas.width * 0.20, y: kenttaCanvas.height - Math.random()*400 },// säätää voi vuorenhuippuja miltä tuntuu
            { x: kenttaCanvas.width * 0.30, y: kenttaCanvas.height - Math.random()*500 },
            { x: kenttaCanvas.width * 0.55, y: kenttaCanvas.height - Math.random()*500},
            { x: kenttaCanvas.width * 0.65, y: kenttaCanvas.height - Math.random()*400 },
            { x: kenttaCanvas.width * 0.75, y: kenttaCanvas.height - Math.random()*400 },
            { x: kenttaCanvas.width * 0.90, y: kenttaCanvas.height*0.96 }, //lopussa myös tykille tila
            { x: kenttaCanvas.width, y: kenttaCanvas.height*0.96 } // Lopetuspiste
        ];

        kenttaCtx.beginPath();
        kenttaCtx.moveTo(pisteet[0].x, pisteet[0].y); // aloituspiste

        for (let i = 1; i < pisteet.length; i++) {
            kenttaCtx.lineTo(pisteet[i].x, pisteet[i].y);
            terrainPoints.push(pisteet[i]); // maaston pisteet tallennetaan
        }
        
        // viivan piirto pisteestä toiseen
        for (let i = 1; i < pisteet.length; i++) {
            kenttaCtx.lineTo(pisteet[i].x, pisteet[i].y);
        }

        // piirretään maaston alareuna takaisin oikeaan alakulmaan ja alas
        kenttaCtx.lineTo(kenttaCanvas.width, kenttaCanvas.height);
        kenttaCtx.lineTo(0, kenttaCanvas.height);
        kenttaCtx.closePath();

        // kentän täyttö
        kenttaCtx.fillStyle = kuvio;
        kenttaCtx.fill();
        };

        drawCloud(Math.random()*(kenttaCanvas.width-40), 100, 40); //piirrä pilvi parametrien mukaan 
        drawCloud(Math.random()*(kenttaCanvas.width-60), 100, 50); //toinenki pilvi
        
        //eka lavetti ja pelaajanimi
        tykkiCtx.font = "bold 20px Comic sans MS";
        tykkiCtx.fillStyle = 'red';
        tykkiCtx.fillText(pelaajat.pelaaja1.nimi, kenttaCanvas.width*0.01, kenttaCanvas.height*0.85);
        tykinPutki1.draw();
        
        //toka lavetti, nimi ja peilikuva
        tykkiCtx.font = "bold 20px Comic sans MS";
        tykkiCtx.fillText(pelaajat.pelaaja2.nimi, kenttaCanvas.width*0.95, kenttaCanvas.height*0.85);
        tykinPutki2.draw();     
}

kanuuna.onload = () => {
    const imgWidth = 50;
    const imgHeight = 50;

    // Piirrä alkuperäinen kuva paikkaan 1
    tykkiCtx.drawImage(kanuuna, pelaajat.pelaaja1.lavetti[0], pelaajat.pelaaja1.lavetti[1], imgWidth, imgHeight);

    // Peilikuvan piirtäminen
    tykkiCtx.save();

    tykkiCtx.scale(-1, 1);
    
    // peilikuva paikkaan 2
    tykkiCtx.drawImage(kanuuna, -pelaajat.pelaaja2.lavetti[0], pelaajat.pelaaja2.lavetti[1], -imgWidth, imgHeight);

    tykkiCtx.restore();  // Palauta alkuperäinen tila
}

function getTerrainHeightAt(x) {
    for (let i = 0; i < terrainPoints.length - 1; i++) {
        if (x >= terrainPoints[i].x && x <= terrainPoints[i + 1].x) {
            // Interpoloi korkeus pisteiden välillä
            const dx = terrainPoints[i + 1].x - terrainPoints[i].x;
            const dy = terrainPoints[i + 1].y - terrainPoints[i].y;
            const ratio = (x - terrainPoints[i].x) / dx;
            return terrainPoints[i].y + ratio * dy;
        }
    }
    return piirtoCanvas.height; // Oletuskorkeus, jos x-koordinaatti on kentän ulkopuolella
};

//piirretään pilvi
function drawCloud(x, y, koko) {
    const pilvenvarit = ['white','#8e8e94','#67676b'];

    kenttaCtx.fillStyle = pilvenvarit[Math.floor(Math.random()*pilvenvarit.length)]; // pilven väri
    kenttaCtx.beginPath();
    
    //pilvet
    kenttaCtx.arc(x, y, koko, Math.PI * 0.5, Math.PI * 1.6);
    kenttaCtx.arc(x + koko, y - koko, koko, Math.PI * 1, Math.PI * 2);
    kenttaCtx.arc(x + koko * 2, y, koko, Math.PI * 1.5, Math.PI * 0.5);    

    kenttaCtx.closePath();
    kenttaCtx.fill();
}

window.addEventListener('DOMContentLoaded', () => {
    drawTerrain();  // tee uusi kenttä
});

function checkWin() {
    if (pelaajat.pelaaja1.osumat >= 3) {
        showWin(pelaajat.pelaaja1.nimi);
    } else if (pelaajat.pelaaja2.osumat >= 3) {
        showWin(pelaajat.pelaaja2.nimi);
    }
};

function showWin(voittaja){
    document.body.innerHTML = '';
    
    const voittoIlmoitus = document.createElement('div');
    voittoIlmoitus.id = "winMessage";
    voittoIlmoitus.style.display = 'flex';
    voittoIlmoitus.style.flexDirection = 'column';
    voittoIlmoitus.style.justifyContent = 'center';
    voittoIlmoitus.style.alignItems = 'center';
    
    voittoIlmoitus.style.fontSize = '48px';
    voittoIlmoitus.style.color = 'yellow';
    
    voittoIlmoitus.style.backgroundColor = 'black';

    voittoIlmoitus.innerHTML = `
        <h1>${voittaja} voitti pelin!</h1>
        <button id="aloitaUudelleen" style="padding: 10px 20px; font-size: 24px; cursor: pointer;">Aloita uusi peli</button>
    `;
    
    document.body.appendChild(voittoIlmoitus);
    
    document.getElementById('aloitaUudelleen').addEventListener('click', function() {
        location.reload(); 
    });
};

// loop
function gameLoop() {
    piirtoCtx.clearRect(0, 0, piirtoCanvas.width, piirtoCanvas.height);
        
    // Piirretään tykin putket
    tykinPutki1.draw();
    tykinPutki2.draw();

    // Päivitetään ja piirretään ammukset
    ammukset.forEach((ammus, index) => {
        ammus.update();
        ammus.draw();
        if (ammus.checkCollision()) {
            ammukset.splice(index, 1);
            tykinPutki1.setAngle(45);
            tykinPutki2.setAngle(45);
        }        
    });

    requestAnimationFrame(gameLoop);
}

document.getElementById('paluu').addEventListener('click', () => {
    sessionStorage.clear('p1', 'p2');
    window.location.href = 'index.html';
});

gameLoop();
