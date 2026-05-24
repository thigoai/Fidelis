import { Canvas, useFrame } from '@react-three/fiber'
import {
  ContactShadows,
  Environment,
  PresentationControls,
  RoundedBox,
  Text,
  // useGLTF,  // ← descomentar quando for trocar pelo seu modelo do Blender
} from '@react-three/drei'
import { Suspense, useRef } from 'react'
import type { Group } from 'three'

export type LoyaltyCard3DProps = {
  storeName: string
  customerName: string
  points: number
  /** Cor base do material. Use a primary_color da loja. */
  accentColor?: string
  /** Tailwind classes para o wrapper. Controle altura/largura por aqui. */
  className?: string
}

/**
 * LoyaltyCard3D — cartão de fidelidade interativo em WebGL.
 *
 * Composição: PresentationControls (rotação manual com mouse) envolve um
 * grupo que tem useFrame (rotação Y lenta e constante). As duas se somam.
 *
 * Performance: dpr clampado entre 1 e 2 para não sobrecarregar telas Retina.
 * shadows habilitado mas só a DirectionalLight projeta sombra; ContactShadows
 * faz a sombra "de chão" sem custo de render-target adicional.
 */
export default function LoyaltyCard3D({
  storeName,
  customerName,
  points,
  accentColor = '#7c3aed',
  className,
}: LoyaltyCard3DProps) {
  return (
    <div className={className ?? 'h-[420px] w-full'}>
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 0.5, 4.2], fov: 32 }}
      >
        {/* ============ Iluminação ============ */}
        <ambientLight intensity={0.45} />

        {/* Key light: dá volume e projeta a sombra principal */}
        <directionalLight
          position={[5, 6, 5]}
          intensity={1.4}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />

        {/* Fill light: contraluz lilás suave para integrar com a paleta brand */}
        <directionalLight position={[-4, 2, -2]} intensity={0.4} color="#a78bfa" />

        {/* HDR ambiente para reflexos no clearcoat.
            drei baixa de uma CDN no 1º load (1-2s) e depois cacheia.
            Em produção, considere baixar um .hdr e servir local. */}
        <Suspense fallback={null}>
          <Environment preset="city" />
        </Suspense>

        {/* ============ Interação com mouse ============
            global=true: o card responde ao mouse em qualquer ponto do Canvas
            snap=true:   ao soltar, volta suavemente para a posição neutra
            polar/azimuth: limitam o quanto pode inclinar (radianos)         */}
        <PresentationControls
          global
          snap
          polar={[-0.4, 0.4]}
          azimuth={[-0.6, 0.6]}
          config={{ mass: 1, tension: 170, friction: 26 }}
        >
          <RotatingCard
            storeName={storeName}
            customerName={customerName}
            points={points}
            accentColor={accentColor}
          />
        </PresentationControls>

        {/* Sombra projetada "no chão" — barata e suave */}
        <ContactShadows
          position={[0, -1.3, 0]}
          opacity={0.45}
          scale={6}
          blur={2.4}
          far={2}
        />
      </Canvas>
    </div>
  )
}

// =====================================================================
// Mesh interno — useFrame fica isolado aqui para que a re-render do pai
// não afete a animação. PresentationControls (no pai) compõe sua rotação
// com esta — não precisa coordenar nada.
// =====================================================================

type CardProps = Omit<LoyaltyCard3DProps, 'className'>

function RotatingCard({ storeName, customerName, points, accentColor }: CardProps) {
  const groupRef = useRef<Group>(null!)

  // Rotação Y constante e sutil. delta é em segundos, então 0.15 rad/s
  // = uma volta completa a cada ~42 segundos.
  useFrame((_, delta) => {
    groupRef.current.rotation.y += delta * 0.15
  })

  // ====================================================================
  // ★ CARREGANDO UM MODELO DO BLENDER ★
  //
  //   1. No Blender: File → Export → glTF 2.0 (.glb). Recomendado:
  //        - "+Y Up" desmarcado (R3F usa Y up por padrão).
  //        - Embeddar texturas (Format: glTF Binary).
  //   2. Salve em: frontend/cliente/public/models/loyalty-card.glb
  //      (qualquer coisa em public/ é servida na raiz do site).
  //   3. Adicione no topo do arquivo, fora do componente:
  //
  //        useGLTF.preload('/models/loyalty-card.glb')
  //
  //   4. Descomente o import do useGLTF lá em cima.
  //   5. Substitua TODO o conteúdo deste return por:
  //
  //        const { scene } = useGLTF('/models/loyalty-card.glb')
  //        return <primitive ref={groupRef} object={scene} dispose={null} />
  //
  //   6. Se o modelo já trouxer materiais/texturas do Blender, remova
  //      o <meshPhysicalMaterial>. Os <Text> abaixo também deixam de
  //      fazer sentido (modelos vêm com geometria pronta) — se quiser
  //      texto dinâmico sobreposto, posicione <Text> em coordenadas
  //      locais ao modelo após inspecionar a escala dele.
  // ====================================================================
  return (
    <group ref={groupRef}>
      {/* Base do cartão — proporção próxima de um cartão de crédito (3 : 1.85) */}
      <RoundedBox
        args={[3, 1.85, 0.08]}
        radius={0.08}
        smoothness={4}
        castShadow
        receiveShadow
      >
        <meshPhysicalMaterial
          color={accentColor}
          metalness={0.6}
          roughness={0.25}
          clearcoat={1}
          clearcoatRoughness={0.1}
        />
      </RoundedBox>

      {/* ===== Frente do cartão ===== */}

      {/* Cabeçalho */}
      <Text
        position={[-1.32, 0.62, 0.045]}
        fontSize={0.11}
        color="#ffffff"
        anchorX="left"
        anchorY="middle"
        letterSpacing={0.18}
      >
        FIDELIS
      </Text>

      {/* Nome da loja — destaque visual primário */}
      <Text
        position={[-1.32, 0.4, 0.045]}
        fontSize={0.2}
        color="#ffffff"
        anchorX="left"
        anchorY="middle"
        maxWidth={2.6}
      >
        {storeName}
      </Text>

      {/* Rodapé esquerdo: titular */}
      <Text
        position={[-1.32, -0.45, 0.045]}
        fontSize={0.085}
        color="#d6d3d1"
        anchorX="left"
        anchorY="middle"
        letterSpacing={0.18}
      >
        TITULAR
      </Text>
      <Text
        position={[-1.32, -0.62, 0.045]}
        fontSize={0.14}
        color="#ffffff"
        anchorX="left"
        anchorY="middle"
        maxWidth={2}
      >
        {customerName}
      </Text>

      {/* Rodapé direito: saldo de pontos */}
      <Text
        position={[1.32, -0.45, 0.045]}
        fontSize={0.085}
        color="#d6d3d1"
        anchorX="right"
        anchorY="middle"
        letterSpacing={0.18}
      >
        PONTOS
      </Text>
      <Text
        position={[1.32, -0.68, 0.045]}
        fontSize={0.28}
        color="#ffffff"
        anchorX="right"
        anchorY="middle"
      >
        {points.toLocaleString('pt-BR')}
      </Text>
    </group>
  )
}

// Quando descomentar o useGLTF acima, descomente também esta linha
// para que o modelo comece a carregar em paralelo ao render inicial:
//
// useGLTF.preload('/models/loyalty-card.glb')
