var v4l2camera = require('v4l2camera');
var Canvas = require('canvas');
var Png = require('png').Png;
var GIFEncoder = require('gifencoder');
var http = require('http');

// Opções gerais
var options = {
  repeat: -1,
  width: 200,
  height: 200,
  quality: 10,
  delay: 1,
  port: 8080 // Porta onde o gif vai streamiar
};

// Iinicializa a câmera
var cam = new v4l2camera.Camera('/dev/video0');
cam.configSet({
  width: options.width,
  height: options.height
});

// Array para os clients conectados
var streams = [];

// Inicializa o servidor web
http.Server(function(req, res) {

  // Sem cache, pls
  res.writeHead(200, {
    'Content-Type': 'image/gif',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });

  // Inicializa a stream do gif e captura os frames
  var gif = new GIFEncoder(options.width, options.height);
  gif.createReadStream().pipe(res);

  // Qualidade do gif e outras configurações
  gif.start();
  gif.setRepeat(options.repeat);
  gif.setDelay(options.delay);
  gif.setQuality(options.quality);

  // Adicionaos ao pessoas que está conectado
  streams.push(gif);

  // Se ele fechar a conexão, tiramos ele da array
  req.on('close', function() {
    streams.splice(streams.indexOf(gif), 1);
  });

}).listen(options.port);

// Inicia o canvas
var canvas = new Canvas(options.width, options.height);
var ctx = canvas.getContext('2d');

// Liga a câmera
cam.start();

// Cores para o texto
var colors = ['#000000', '#ffffff', '#ff0000'];

// Inicia o loop constante de captura
cam.capture(function loop(sucess) {
  if (!sucess)
    return;

  // Cria um buffer com a array RGB recebida
  var rgb = new Buffer(cam.toRGB());
  var png = new Png(rgb, cam.width, cam.height, 'rgb');

  // Cira uma nova imagens através do PNG
  var img = new Canvas.Image();
  img.src = png.encodeSync();

  // Dezenha esse PNG np canvas
  ctx.drawImage(img, 0, 0, options.width, options.height);

  // Escreve um texto no canvas
  ctx.font = '30px Impact';
  ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
  ctx.fillText('Show me boobs!', 0, options.height, options.width);

  // Envia mais um frame para cada usuário conectado
  streams.forEach(function(gif) {
    gif.addFrame(ctx);
  });

  // Faz mais uma captura
  cam.capture(loop);
});
