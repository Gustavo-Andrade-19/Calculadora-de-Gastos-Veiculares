
function inicializarTema() {
    const temaSalvo = localStorage.getItem('tema');
    const temaPreferido = temaSalvo || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    
    if (temaPreferido === 'dark') {
        document.body.classList.add('dark-mode');
    }
}

function alternarTema() {
    document.body.classList.toggle('dark-mode');
    const temaPadrao = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
    localStorage.setItem('tema', temaPadrao);
}


inicializarTema();


function abrirAba(indice) {
    const abas = document.querySelectorAll('.tab-content');
    abas.forEach(aba => aba.classList.remove('active'));

    document.getElementById(`aba${indice}`).classList.add('active');

    const botoes = document.querySelectorAll('.tab-btn');
    botoes.forEach((btn, i) => {
        if (i === indice) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    const indicator = document.querySelector('.tab-indicator');
    const botaoAtivo = botoes[indice];
    const larguraBotao = botaoAtivo.offsetWidth;
    const posicaoBotao = botaoAtivo.offsetLeft;
    
    indicator.style.left = posicaoBotao + 'px';
    indicator.style.width = larguraBotao + 'px';

    // Carregar histórico apenas se logado e na aba 2
    if (indice === 2) {
        const token = localStorage.getItem('token');
        if (token) {
            carregarHistorico();
        }
    }
}

function calcularGasto() {
    
    const kmLitro = parseFloat(document.getElementById('kmLitro').value);
    let distancia = parseFloat(document.getElementById('distancia').value);
    const precoCombustivel = parseFloat(document.getElementById('precoCombustivel').value);
    const idaVolta = document.getElementById('idaVolta').checked;

    
    const distanciaOriginal = distancia;
    if (idaVolta) {
        distancia = distancia * 2;
    }

    
    const resultado = document.getElementById('resultado');

   
    if (!kmLitro || !distanciaOriginal || !precoCombustivel) {
        resultado.innerHTML = '<h2> Erro: Preencha todos os campos!</h2>';
        resultado.classList.add('ativo', 'erro');
        return;
    }

    if (kmLitro <= 0 || distanciaOriginal <= 0 || precoCombustivel <= 0) {
        resultado.innerHTML = '<h2> Erro: Os valores devem ser maiores que zero!</h2>';
        resultado.classList.add('ativo', 'erro');
        return;
    }

    
   const dados = {
    kmLitro: kmLitro,
    distancia: distancia,
    precoCombustivel: precoCombustivel
};

fetch('http://localhost:3000/calcular', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(dados)
})
.then(response => response.json())
.then(data => {
    const litrosNecessarios = data.litrosNecessarios;
    const custoTotal = data.custoTotal;
    
    // Cálculos adicionais: Manutenção (2x) e Lucro (30%)
    const custoManutencao = custoTotal * 2;
    const valorComManutencao = custoTotal + custoManutencao;
    const lucro = valorComManutencao * 0.30;
    const valorFinal = valorComManutencao + lucro;

    
    resultado.classList.remove('erro');
    let avisoIdaVolta = '';
    if (idaVolta) {
        avisoIdaVolta = '<div style="color: var(--accent); font-weight: 600; margin-bottom: 10px;">🔄 Cálculo considerando ida e volta</div>';
    }
    
    resultado.innerHTML = `
        <h2>✓ Resultado do Cálculo</h2>
        ${avisoIdaVolta}
        <div class="resultado-item">
            <strong>Consumo do veículo:</strong> ${kmLitro} km/litro
        </div>
        <div class="resultado-item">
            <strong>Distância:</strong> ${idaVolta ? distanciaOriginal + ' km (ida) + ' + distanciaOriginal + ' km (volta) = ' + distancia : distanciaOriginal} km
        </div>
        <div class="resultado-item">
            <strong>Preço do combustível:</strong> R$ ${precoCombustivel.toFixed(2)}
        </div>
        <div class="resultado-item">
            <strong>Litros necessários:</strong> ${litrosNecessarios.toFixed(2)} L
        </div>
        <div class="resultado-item">
             <strong>Custo combustível:</strong> R$ ${custoTotal.toFixed(2)}
        </div>
        <div class="resultado-item" style="border-top: 1px solid var(--border); padding-top: 10px; margin-top: 10px;">
             <strong>Custo de manutenção (2x):</strong> R$ ${custoManutencao.toFixed(2)}
        </div>
        <div class="resultado-item">
             <strong>Subtotal:</strong> R$ ${valorComManutencao.toFixed(2)}
        </div>
        <div class="resultado-item">
             <strong>Lucro (30%):</strong> R$ ${lucro.toFixed(2)}
        </div>
        <div class="resultado-total">
             Valor final: R$ ${valorFinal.toFixed(2)}
        </div>
    `;
    resultado.classList.add('ativo');

   
    const origem = document.getElementById('origem').value;
    const destino = document.getElementById('destino').value;

    const dadosSalvar = {
        origem: origem || 'Não informado',
        destino: destino || 'Não informado',
        distancia: distanciaOriginal,
        kmLitro: kmLitro,
        precoCombustivel: precoCombustivel,
        litrosNecessarios: litrosNecessarios,
        custoTotal: custoTotal
    };

    fetch('http://localhost:3000/salvar-calculo', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem('token')
        },
        body: JSON.stringify(dadosSalvar)
    })
    .then(res => res.json())
    .then(resposta => {
        console.log('Cálculo salvo:', resposta);
        
        carregarHistorico();
    })
    .catch(erro => console.error('Erro ao salvar:', erro));
})
}


document.addEventListener('DOMContentLoaded', function() {
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                calcularGasto();
            }
        });
    });
});

function mostrarMapa() {
    const origem = document.getElementById('origem').value;
    const destino = document.getElementById('destino').value;

    if (!origem || !destino) {
        mostrarToast('Por favor, preencha origem e destino', 'error');
        return;
    }


    
    const mapaDiv = document.getElementById('mapa');
    if (window.mapaInstance) {
        window.mapaInstance.remove();
        window.mapaInstance = null;
    }

    
    Promise.all([
        fetch(`http://localhost:3000/geocodificar?endereco=${encodeURIComponent(origem)}`)
            .then(res => res.json()),
        fetch(`http://localhost:3000/geocodificar?endereco=${encodeURIComponent(destino)}`)
            .then(res => res.json())
    ])
    .then(([origemData, destinoData]) => {
        
        if (origemData.erro || destinoData.erro) {
            mostrarToast('Endereço não encontrado. Tente outro!', 'error');
            return;
        }

        
        const origemCoords = [origemData.lat, origemData.lon];
        const destinoCoords = [destinoData.lat, destinoData.lon];

        
        const mapa = L.map('mapa').setView(origemCoords, 10);
        window.mapaInstance = mapa;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap',
            maxZoom: 19
        }).addTo(mapa);

        
        const control = L.Routing.control({
            waypoints: [
                L.latLng(origemCoords[0], origemCoords[1]),
                L.latLng(destinoCoords[0], destinoCoords[1])
            ],
            routeWhileDragging: true
        }).addTo(mapa);

        
        control.on('routesfound', function(e) {
            const routes = e.routes;
            const distanciaKm = routes[0].summary.totalDistance / 1000;
            
            
            document.getElementById('distancia').value = distanciaKm.toFixed(2);
        });
    })
    .catch(error => {
        console.error('Erro ao buscar coordenadas:', error);
        alert('Erro ao buscar endereço. Tente novamente!');
    });
}

function calcularOrcamento() {
    const dias = parseFloat(document.getElementById('dias').value);
    const kmDia = parseFloat(document.getElementById('kmDia').value);
    const consumo = parseFloat(document.getElementById('kmLitro').value);
    const precoCombustivel = parseFloat(document.getElementById('precoCombustivel').value);

    const resultadoOrcamento = document.getElementById('resultadoOrcamento');

    
    if (!dias || !kmDia || !consumo || !precoCombustivel) {
        resultadoOrcamento.innerHTML = '<h2>⚠️ Erro: Preencha todos os campos!</h2>';
        resultadoOrcamento.classList.add('ativo', 'erro');
        return;
    }

    if (dias <= 0 || kmDia <= 0) {
        resultadoOrcamento.innerHTML = '<h2>⚠️ Erro: Os valores devem ser maiores que zero!</h2>';
        resultadoOrcamento.classList.add('ativo', 'erro');
        return;
    }

    
    const custoCombustivel = ((kmDia * dias) / consumo) * precoCombustivel;
    const valorComManutencao = custoCombustivel * 2;
    const valorFinal = valorComManutencao * 1.30;

    
    resultadoOrcamento.classList.remove('erro');
    resultadoOrcamento.innerHTML = `
        <h2>✓ Orçamento de Viagem</h2>
        <div class="resultado-item">
            <strong>Dias de viagem:</strong> ${dias} dias
        </div>
        <div class="resultado-item">
            <strong>Km por dia:</strong> ${kmDia} km
        </div>
        <div class="resultado-item">
            <strong>Km total:</strong> ${(kmDia * dias).toFixed(2)} km
        </div>
        <div class="resultado-item">
            <strong>Custo combustível:</strong> R$ ${custoCombustivel.toFixed(2)}
        </div>
        <div class="resultado-item">
            <strong>Custo com manutenção (2x):</strong> R$ ${valorComManutencao.toFixed(2)}
        </div>
        <div class="resultado-total">
             Valor final (+ 30%): R$ ${valorFinal.toFixed(2)}
        </div>
    `;
    resultadoOrcamento.classList.add('ativo');
}

function carregarHistorico() {
    const token = localStorage.getItem('token');
    
    fetch('http://localhost:3000/historico', {
        headers: {
            'Authorization': 'Bearer ' + token
        }
    })
        .then(res => res.json())
        .then(data => {
            const historicoDiv = document.getElementById('historico');
            
            if (!historicoDiv) {
                console.log('Div de histórico não encontrada');
                return;
            }

            if (!data.historico || data.historico.length === 0) {
                historicoDiv.innerHTML = '<p style="color: #999;">Nenhum cálculo salvo ainda.</p>';
                return;
            }

            let html = '<h3>📋 Últimos Cálculos</h3>';
            html += '<div style="max-height: 300px; overflow-y: auto;">';

            data.historico.forEach((calculo, index) => {
                html += `
                    <div style="border-bottom: 1px solid #ddd; padding: 10px; margin: 10px 0;">
                        <strong>${index + 1}. ${calculo.origem} → ${calculo.destino}</strong><br>
                        Distância: ${calculo.distancia.toFixed(2)} km | 
                        Custo: R$ ${calculo.custoTotal.toFixed(2)}<br>
                        <small style="color: #999;">
                            ${new Date(calculo.dataCriacao).toLocaleString('pt-BR')}
                        </small>
                    </div>
                `;
            });

            html += '</div>';
            historicoDiv.innerHTML = html;
        })
        .catch(erro => console.error('Erro ao carregar histórico:', erro));
}


document.addEventListener('DOMContentLoaded', function() {
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', alternarTema);
    }
    
  
    verificarAutenticacao();
});




function verificarAutenticacao() {
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('usuarioEmail');
    
    if (token && email) {
        
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('historicoSection').style.display = 'block';
        document.getElementById('usuarioEmail').textContent = email;
    } else {
       
        document.getElementById('loginSection').style.display = 'block';
        document.getElementById('historicoSection').style.display = 'none';
    }
}


function alterarAbaAuth(aba) {
   
    document.getElementById('loginForm').classList.remove('active');
    document.getElementById('registroForm').classList.remove('active');
    
    
    document.getElementById('loginErro').innerHTML = '';
    document.getElementById('registroErro').innerHTML = '';
    
    
    if (aba === 'login') {
        document.getElementById('loginForm').classList.add('active');
        document.querySelector('.auth-tab-btn:nth-child(1)').classList.add('active');
        document.querySelector('.auth-tab-btn:nth-child(2)').classList.remove('active');
    } else if (aba === 'registro') {
        document.getElementById('registroForm').classList.add('active');
        document.querySelector('.auth-tab-btn:nth-child(1)').classList.remove('active');
        document.querySelector('.auth-tab-btn:nth-child(2)').classList.add('active');
    }
}


async function fazerLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const senha = document.getElementById('loginSenha').value;
    const erroDiv = document.getElementById('loginErro');
    
   
    if (!email || !senha) {
        erroDiv.innerHTML = ' Email e senha são obrigatórios!';
        return;
    }
    
    try {
        const response = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, senha })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            
            localStorage.setItem('token', data.token);
            localStorage.setItem('usuarioEmail', email);
            erroDiv.innerHTML = ' Login realizado com sucesso!';
            
           
            document.getElementById('loginEmail').value = '';
            document.getElementById('loginSenha').value = '';
            
           
            setTimeout(() => {
                verificarAutenticacao();
            }, 500);
        } else {
           
            erroDiv.innerHTML = ` ${data.erro}`;
        }
    } catch (erro) {
        erroDiv.innerHTML = ' Erro ao fazer login: ' + erro.message;
    }
}


async function fazerRegistro() {
    const email = document.getElementById('registroEmail').value.trim();
    const senha = document.getElementById('registroSenha').value;
    const confirmar = document.getElementById('registroConfirm').value;
    const erroDiv = document.getElementById('registroErro');
    
    
    if (!email || !senha || !confirmar) {
        erroDiv.innerHTML = ' Preencha todos os campos!';
        return;
    }
    
    if (senha !== confirmar) {
        erroDiv.innerHTML = ' As senhas não conferem!';
        return;
    }
    
    if (senha.length < 6) {
        erroDiv.innerHTML = ' A senha deve ter no mínimo 6 caracteres!';
        return;
    }
    
    try {
        const response = await fetch('http://localhost:3000/registrar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, senha })
        });
        
        const data = await response.json();
        
        if (response.ok) {
         
            erroDiv.innerHTML = ' Usuário registrado com sucesso! Fazendo login...';
            
       
            document.getElementById('registroEmail').value = '';
            document.getElementById('registroSenha').value = '';
            document.getElementById('registroConfirm').value = '';
            
 
            setTimeout(() => {
                fazerLogin();
            }, 1000);
        } else {
     
            erroDiv.innerHTML = ` ${data.erro}`;
        }
    } catch (erro) {
        erroDiv.innerHTML = ' Erro ao registrar: ' + erro.message;
    }
}


function fazerLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuarioEmail');
    verificarAutenticacao();
    alterarAbaAuth('login');
}
