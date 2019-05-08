<div class="copyright" >
  <span class="author" itemprop="copyrightHolder">
	<a href="http://www.beian.miit.gov.cn" target="_blank">粤ICP备18089856号-1</a>
  </span>
  <span class="with-love">
	<img src="http://www.uuu9.com/skin2016/images/beian.png">
  </span>
  <span class="author" itemprop="copyrightHolder">
	<a href="http://www.beian.gov.cn/portal/registerSystemInfo?recordcode=44010302000471" target="_blank">粤公网安备 44010302000471号</a>
  </span>
  <span class="with-love">
    <i class="fa fa-{{ theme.authoricon }}"></i>
  </span>
  {% set current = date(Date.now(), "YYYY") %}
  Copyright &copy; {% if theme.since and theme.since != current %} {{ theme.since }} - {% endif %}
  <span itemprop="copyrightYear">{{ current }}</span>
</div>

{% if theme.copyright %}
<div class="powered-by">
  {{ __('footer.powered', '<a class="theme-link" href="https://hexo.io">Hexo</a>') }}
</div>

<div class="theme-info">
  {{ __('footer.theme') }} -
  <a class="theme-link" href="https://github.com/iissnan/hexo-theme-next">
    NexT.{{ theme.scheme }}
  </a>
</div>
{% endif %}
