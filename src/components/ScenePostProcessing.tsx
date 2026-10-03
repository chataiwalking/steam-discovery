import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector2 } from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { FXAAShader } from "three/addons/shaders/FXAAShader.js";

interface Pipeline {
  composer: EffectComposer;
  bloom: UnrealBloomPass;
  fxaa: ShaderPass;
  samples: number;
  elapsed: number;
  slowWindows: number;
  reduced: boolean;
}

/** One render owner; linear lighting is tone-mapped once, before sRGB FXAA. */
export function ScenePostProcessing({ paused }: { paused: boolean }) {
  const { gl, scene, camera, size, viewport, invalidate } = useThree();
  const pipeline = useRef<Pipeline | null>(null);

  useEffect(() => {
    const composer = new EffectComposer(gl);
    const render = new RenderPass(scene, camera);
    // Threshold above white preserves the distinct RGB colours of optical lessons.
    const bloom = new UnrealBloomPass(new Vector2(1, 1), 0.2, 0.35, 1.35);
    const output = new OutputPass();
    const fxaa = new ShaderPass(FXAAShader);
    composer.addPass(render);
    composer.addPass(bloom);
    composer.addPass(output);
    composer.addPass(fxaa);
    pipeline.current = { composer, bloom, fxaa, samples: 0, elapsed: 0, slowWindows: 0, reduced: false };
    gl.domElement.dataset.sceneEffects = "bloom-fxaa";
    invalidate();
    return () => {
      pipeline.current = null;
      for (const pass of composer.passes) pass.dispose();
      composer.dispose();
      delete gl.domElement.dataset.sceneEffects;
    };
  }, [gl, scene, camera, invalidate]);

  useEffect(() => {
    const current = pipeline.current;
    if (!current) return;
    const dpr = Math.min(viewport.dpr, size.width < 640 ? 1 : 1.5);
    current.composer.setPixelRatio(dpr);
    current.composer.setSize(size.width, size.height);
    current.fxaa.uniforms.resolution.value.set(1 / (size.width * dpr), 1 / (size.height * dpr));
    current.bloom.enabled = size.width >= 640 && !current.reduced;
    gl.domElement.dataset.sceneEffects = current.bloom.enabled ? "bloom-fxaa" : "fxaa";
    invalidate();
  }, [gl, size.width, size.height, viewport.dpr, invalidate]);

  useEffect(() => {
    if (pipeline.current) {
      pipeline.current.samples = 0;
      pipeline.current.elapsed = 0;
    }
  }, [paused]);

  useFrame((_, delta) => {
    const current = pipeline.current;
    if (!current) {
      gl.render(scene, camera);
      return;
    }
    // Ignore tab restoration / suspended loads. Three slow windows disable only
    // optional bloom, retaining responsive science controls and anti-aliasing.
    if (!paused && delta > 0 && delta < 0.12 && !current.reduced) {
      current.samples++;
      current.elapsed += delta;
      if (current.samples >= 45) {
        current.slowWindows = current.elapsed / current.samples > 0.032 ? current.slowWindows + 1 : 0;
        current.samples = 0;
        current.elapsed = 0;
        if (current.slowWindows >= 3) {
          current.reduced = true;
          current.bloom.enabled = false;
          gl.domElement.dataset.sceneEffects = "fxaa";
        }
      }
    }
    current.composer.render(delta);
  }, 1);
  return null;
}
